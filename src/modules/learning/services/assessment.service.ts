import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SubmitAssessmentAttemptSchema } from "../schemas/assessment.schema";
import { attemptDeadline, evaluateAttemptAvailability, scoreAssessment, shuffle, type QuestionDefinition } from "./assessment-engine";
import { requireLearningManager, requireLearningUser } from "./identity.adapter";
import { canAccessChapter, canStartLessons, canStartChapterExam, canStartFinalExam } from "./progression.service";
import { getActiveEnrollmentForCourse, loadChapterGateStates } from "./progression-query.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Format jawaban tidak dapat disimpan.");
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

export async function startAssessmentAttempt(assessmentId: string) {
  const user = await requireLearningUser();
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, isPublished: true },
    include: {
      questions: {
        orderBy: { displayOrder: "asc" },
        include: { options: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
  if (!assessment) throw new Error("Assessment tidak ditemukan atau belum diterbitkan.");
  const enrollment = await getActiveEnrollmentForCourse(assessment.courseId, user.id);
  if (!enrollment || enrollment.status !== "ACTIVE") throw new Error("Enrollment aktif tidak ditemukan.");
  const gates = await loadChapterGateStates(assessment.courseId, enrollment.id);

  if (assessment.chapterId && assessment.stage === "PRETEST") {
    const index = gates.findIndex((chapter) => chapter.id === assessment.chapterId);
    if (!canAccessChapter(index, gates).allowed) throw new Error("Chapter sebelumnya belum diselesaikan.");
  }
  if (assessment.chapterId && assessment.stage !== "PRETEST") {
    const chapter = gates.find((item) => item.id === assessment.chapterId);
    if (!chapter || !canStartLessons(chapter).allowed) {
      throw new Error("Pretest wajib pada chapter ini harus lulus sebelum aktivitas berikutnya.");
    }
  }

  if (assessment.stage === "POSTTEST") {
    if (assessment.lessonId) {
      const requiredBlocks = await prisma.lessonContentBlock.findMany({
        where: { lessonId: assessment.lessonId, isRequired: true }, select: { id: true },
      });
      if (requiredBlocks.length) {
        const completed = await prisma.lessonContentProgress.count({
          where: {
            enrollmentId: enrollment.id,
            contentBlockId: { in: requiredBlocks.map((block) => block.id) },
            completedAt: { not: null },
          },
        });
        if (completed < requiredBlocks.length) throw new Error("Selesaikan seluruh materi wajib sebelum mengikuti posttest.");
      }
    } else if (assessment.chapterId) {
      const chapter = gates.find((item) => item.id === assessment.chapterId);
      if (!chapter || chapter.lessons.some((lesson) => lesson.required && !lesson.completed)) {
        throw new Error("Selesaikan seluruh lesson chapter sebelum posttest.");
      }
    }
  }
  if (assessment.stage === "CHAPTER_EXAM" && assessment.chapterId) {
    const chapter = gates.find((item) => item.id === assessment.chapterId);
    if (!chapter || !canStartChapterExam(chapter).allowed) throw new Error("Persyaratan chapter belum terpenuhi.");
  }
  if (assessment.stage === "FINAL_EXAM" && !canStartFinalExam(gates).allowed) {
    throw new Error("Selesaikan seluruh persyaratan chapter sebelum final exam.");
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { enrollmentId: enrollment.id, assessmentId },
    orderBy: { attemptNumber: "desc" },
    select: { id: true, attemptNumber: true, status: true, submittedAt: true },
  });
  const existingActive = attempts.find((row) => row.status === "IN_PROGRESS");
  if (existingActive) {
    const active = await prisma.assessmentAttempt.findUnique({ where: { id: existingActive.id } });
    if (active?.deadlineAt && active.deadlineAt.getTime() < Date.now()) {
      await prisma.assessmentAttempt.updateMany({
        where: { id: active.id, status: "IN_PROGRESS" },
        data: { status: "EXPIRED", submittedAt: new Date() },
      });
    } else if (active) {
      const optionOrder = (active.optionOrder ?? {}) as Record<string, string[]>;
      const questionById = new Map(assessment.questions.map((question) => [question.id, question]));
      const orderedIds = active.questionOrder.length ? active.questionOrder : assessment.questions.map((question) => question.id);
      const savedAnswers = Array.isArray(active.answerSnapshot)
        ? active.answerSnapshot as unknown as Array<{ questionId: string; answer: unknown }>
        : [];
      return {
        attemptId: active.id,
        startedAt: active.startedAt,
        deadlineAt: active.deadlineAt,
        stage: assessment.stage,
        title: assessment.title,
        instructions: assessment.instructions,
        answers: savedAnswers,
        questions: orderedIds.map((id) => questionById.get(id)).filter((question): question is NonNullable<typeof question> => Boolean(question)).map((question) => {
          const order = optionOrder[question.id] ?? question.options.map((option) => option.id);
          const byId = new Map(question.options.map((option) => [option.id, option]));
          return {
            id: question.id, type: question.type, prompt: question.prompt, points: Number(question.points),
            options: order.map((optionId) => byId.get(optionId)).filter((option): option is NonNullable<typeof option> => Boolean(option))
              .map((option) => ({ id: option.id, label: option.label })),
          };
        }),
      };
    }
  }

  const availability = evaluateAttemptAvailability({
    policy: { maxAttempts: assessment.maxAttempts, retryCooldownSeconds: assessment.retryCooldownSeconds },
    attemptCount: attempts.length,
    activeAttempt: false,
    lastFinishedAt: attempts.find((row) => row.submittedAt !== null)?.submittedAt ?? null,
  });
  if (!availability.allowed) {
    const message = availability.reason === "COOLDOWN"
      ? "Masa jeda sebelum percobaan berikutnya belum berakhir."
      : "Batas percobaan assessment sudah tercapai.";
    throw new Error(message);
  }

  const questions = assessment.shuffleQuestions ? shuffle(assessment.questions) : assessment.questions;
  const optionOrder: Record<string, string[]> = {};
  for (const question of questions) {
    const options = assessment.shuffleOptions ? shuffle(question.options) : question.options;
    optionOrder[question.id] = options.map((option) => option.id);
  }
  const startedAt = new Date();
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      enrollmentId: enrollment.id, assessmentId, attemptNumber: attempts.length + 1,
      status: "IN_PROGRESS", startedAt, deadlineAt: attemptDeadline(startedAt, assessment.timeLimitSeconds),
      questionOrder: questions.map((question) => question.id),
      optionOrder: optionOrder as Prisma.InputJsonValue,
    },
  });
  return {
    attemptId: attempt.id, startedAt, deadlineAt: attempt.deadlineAt,
    stage: assessment.stage, title: assessment.title, instructions: assessment.instructions,
    answers: [] as Array<{ questionId: string; answer: unknown }>,
    questions: questions.map((question) => {
      const order = optionOrder[question.id] ?? [];
      const byId = new Map(question.options.map((option) => [option.id, option]));
      return {
        id: question.id, type: question.type, prompt: question.prompt, points: Number(question.points),
        options: order.map((id) => byId.get(id)).filter((option): option is NonNullable<typeof option> => Boolean(option))
          .map((option) => ({ id: option.id, label: option.label })),
      };
    }),
  };
}

export async function saveAssessmentAttemptDraft(
  attemptId: string,
  rawAnswers: Array<{ questionId: string; answer: unknown }>,
) {
  const user = await requireLearningUser();
  const parsed = SubmitAssessmentAttemptSchema.parse({ attemptId, answers: rawAnswers });
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      enrollment: { select: { userId: true } },
      assessment: { select: { questions: { select: { id: true } } } },
    },
  });
  if (!attempt || attempt.enrollment.userId !== user.id) throw new Error("Attempt tidak ditemukan.");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt tidak lagi aktif.");
  if (attempt.deadlineAt && Date.now() > attempt.deadlineAt.getTime()) {
    await prisma.assessmentAttempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: { status: "EXPIRED", submittedAt: new Date() },
    });
    throw new Error("Waktu pengerjaan assessment telah habis.");
  }
  const validIds = new Set(attempt.assessment.questions.map((question) => question.id));
  if (parsed.answers.some((answer) => !validIds.has(answer.questionId))) {
    throw new Error("Draft berisi pertanyaan di luar assessment.");
  }
  const saved = await prisma.assessmentAttempt.updateMany({
    where: { id: attempt.id, status: "IN_PROGRESS" },
    data: { answerSnapshot: toJson(parsed.answers) },
  });
  if (saved.count !== 1) throw new Error("Attempt berubah saat draft disimpan.");
  return { saved: true, savedAt: new Date() };
}

export async function submitAssessmentAttempt(attemptId: string, rawAnswers: unknown) {
  const user = await requireLearningUser();
  const parsed = SubmitAssessmentAttemptSchema.parse(rawAnswers);
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      enrollment: { select: { userId: true } },
      assessment: { include: { questions: { include: { options: true } } } },
    },
  });
  if (!attempt || attempt.enrollment.userId !== user.id) throw new Error("Attempt tidak ditemukan.");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt sudah diserahkan atau tidak lagi aktif.");

  const now = new Date();
  if (attempt.deadlineAt && now.getTime() > attempt.deadlineAt.getTime()) {
    await prisma.assessmentAttempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: { status: "EXPIRED", submittedAt: now },
    });
    throw new Error("Waktu pengerjaan assessment telah habis.");
  }

  const questionIds = new Set(attempt.assessment.questions.map((question) => question.id));
  if (parsed.answers.some((answer) => !questionIds.has(answer.questionId))) {
    throw new Error("Jawaban mengandung questionId yang bukan bagian dari assessment ini.");
  }
  const definitions: QuestionDefinition[] = attempt.assessment.questions.map((question) => ({
    id: question.id,
    type: question.type,
    points: Number(question.points),
    correctOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
    acceptedAnswers: question.acceptedAnswers,
    correctAnswer: question.correctAnswer ?? undefined,
    requiresManualReview: question.requiresManualReview,
    isRequired: question.isRequired,
  }));
  const grade = scoreAssessment(definitions, parsed.answers.map((a) => ({ questionId: a.questionId, answer: a.answer ?? null })), Number(attempt.assessment.passingScore));
  const status = grade.pendingReview ? "PENDING_REVIEW" : "GRADED";

  await prisma.$transaction(async (tx) => {
    const claim = await tx.assessmentAttempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: {
        status,
        submittedAt: now,
        gradedAt: grade.pendingReview ? null : now,
        score: grade.earnedPoints,
        maxScore: grade.maxPoints,
        passed: grade.passed,
        pendingReview: grade.pendingReview,
        answerSnapshot: toJson(parsed.answers),
      },
    });
    if (claim.count !== 1) throw new Error("Attempt telah diproses oleh permintaan lain.");
    if (parsed.answers.length) {
      await tx.assessmentAnswer.createMany({
        data: parsed.answers.map((answer) => {
          const row = grade.questionResults.find((item) => item.questionId === answer.questionId);
          return {
            attemptId: attempt.id,
            questionId: answer.questionId,
            answer: toJson(answer.answer),
            isCorrect: row?.isCorrect ?? null,
            pointsEarned: row?.pointsEarned ?? 0,
          };
        }),
      });
    }
  });

  return {
    attemptId,
    status,
    score: grade.percentage,
    earnedPoints: grade.earnedPoints,
    maxPoints: grade.maxPoints,
    passed: grade.passed,
    pendingReview: grade.pendingReview,
    questionResults: attempt.assessment.allowReview
      ? grade.questionResults.map((row) => ({
          ...row,
          explanation: attempt.assessment.showExplanation
            ? attempt.assessment.questions.find((question) => question.id === row.questionId)?.explanation ?? null
            : null,
        }))
      : undefined,
  };
}

export async function gradeManualAssessmentAttempt(input: {
  attemptId: string; questionId: string; isCorrect: boolean; feedback?: string;
}) {
  const reviewer = await requireLearningManager();
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: input.attemptId },
    include: { assessment: { include: { questions: true } }, answers: true },
  });
  if (!attempt || attempt.status !== "PENDING_REVIEW") throw new Error("Attempt tidak sedang menunggu review.");
  const question = attempt.assessment.questions.find((row) => row.id === input.questionId);
  const answer = attempt.answers.find((row) => row.questionId === input.questionId);
  if (!question?.requiresManualReview || !answer) throw new Error("Jawaban yang memerlukan review tidak ditemukan.");

  await prisma.assessmentAnswer.update({
    where: { id: answer.id },
    data: {
      isCorrect: input.isCorrect,
      pointsEarned: input.isCorrect ? question.points : 0,
      graderFeedback: input.feedback?.trim() || null,
    },
  });
  const refreshed = await prisma.assessmentAnswer.findMany({
    where: { attemptId: attempt.id },
    include: { question: true },
  });
  const requiredQuestions = attempt.assessment.questions.filter((row) => row.isRequired);
  const allReviewed = requiredQuestions.every((questionRow) => {
    if (!questionRow.requiresManualReview) return true;
    const answerRow = refreshed.find((row) => row.questionId === questionRow.id);
    return !answerRow || answerRow.isCorrect !== null;
  });
  if (!allReviewed) return { status: "PENDING_REVIEW" as const };

  const earned = refreshed
    .filter((row) => row.question.isRequired)
    .reduce((sum, row) => sum + Number(row.pointsEarned), 0);
  const max = requiredQuestions.reduce((sum, row) => sum + Number(row.points), 0);
  const percentage = max === 0 ? 0 : earned / max * 100;
  return prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "GRADED",
      gradedAt: new Date(),
      pendingReview: false,
      score: earned,
      maxScore: max,
      passed: percentage >= Number(attempt.assessment.passingScore),
      feedback: "Dinilai oleh " + reviewer.name,
    },
  });
}

export async function getMyAssessmentAttempts(assessmentId: string) {
  const user = await requireLearningUser();
  return prisma.assessmentAttempt.findMany({
    where: { assessmentId, enrollment: { userId: user.id } },
    orderBy: { attemptNumber: "desc" },
    select: {
      id: true, attemptNumber: true, status: true, startedAt: true,
      submittedAt: true, score: true, maxScore: true, passed: true, pendingReview: true,
    },
  });
}
