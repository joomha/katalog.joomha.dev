import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { CreateAssessmentSchema } from "../schemas/assessment.schema";
import { LearningGameConfigSchema } from "../schemas/game.schema";
import { requireLearningManager } from "./identity.adapter";

const CreateGameSchema = z.object({
  courseId: z.string().uuid(), chapterId: z.string().uuid().optional(), lessonId: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isRequired: z.boolean().default(false), isPublished: z.boolean().default(false), displayOrder: z.number().int().min(0).default(0),
  game: LearningGameConfigSchema,
}).superRefine((value, ctx) => {
  if (value.lessonId && !value.chapterId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Game pada lesson wajib menyertakan chapterId.", path: ["chapterId"] });
});
export async function createAssessment(input: unknown) {
  await requireLearningManager();
  const parsed = CreateAssessmentSchema.parse(input);
  const course = await prisma.course.findUnique({ where: { id: parsed.courseId }, select: { id: true, status: true } });
  if (!course || course.status === "PUBLISHED") throw new Error("Course tidak ditemukan atau sudah dipublikasikan.");
  if (parsed.chapterId) {
    const chapter = await prisma.courseChapter.findFirst({ where: { id: parsed.chapterId, courseId: parsed.courseId } });
    if (!chapter) throw new Error("Chapter bukan bagian dari course ini.");
  }
  if (parsed.lessonId) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: parsed.lessonId, chapter: { courseId: parsed.courseId, ...(parsed.chapterId ? { id: parsed.chapterId } : {}) } },
    });
    if (!lesson) throw new Error("Lesson bukan bagian dari course/chapter ini.");
  }
  return prisma.assessment.create({
    data: {
      courseId: parsed.courseId, chapterId: parsed.chapterId, lessonId: parsed.lessonId, stage: parsed.stage,
      title: parsed.title, description: parsed.description, instructions: parsed.instructions,
      passingScore: parsed.policy.passingScore, maxAttempts: parsed.policy.maxAttempts,
      timeLimitSeconds: parsed.policy.timeLimitSeconds, retryCooldownSeconds: parsed.policy.retryCooldownSeconds,
      shuffleQuestions: parsed.policy.shuffleQuestions, shuffleOptions: parsed.policy.shuffleOptions,
      showExplanation: parsed.policy.showExplanation, allowReview: parsed.policy.allowReview, isRequired: parsed.policy.isRequired,
      questions: { create: parsed.questions.map((question) => ({
        type: question.type, prompt: question.prompt, explanation: question.explanation, points: question.points,
        displayOrder: question.displayOrder, isRequired: question.isRequired,
        ...(question.correctAnswer === undefined ? {} : { correctAnswer: question.correctAnswer as Prisma.InputJsonValue }),
        acceptedAnswers: question.acceptedAnswers, requiresManualReview: question.requiresManualReview,
        options: { create: question.options.map((option) => ({
          optionKey: option.optionKey, label: option.label, isCorrect: option.isCorrect, displayOrder: option.displayOrder,
        })) },
      })) },
    },
  });
}
export async function publishAssessment(assessmentId: string) {
  await requireLearningManager();
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: true, questions: { include: { options: true } } } });
  if (!assessment || assessment.course.status === "PUBLISHED") throw new Error("Assessment tidak ditemukan atau course sudah dipublikasikan.");
  if (!assessment.questions.length) throw new Error("Assessment harus memiliki minimal satu soal.");
  for (const question of assessment.questions) {
    if (["SINGLE_CHOICE", "TRUE_FALSE"].includes(question.type) && question.options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error("Setiap soal pilihan tunggal harus memiliki tepat satu jawaban benar.");
    }
    if (question.type === "MULTIPLE_SELECT" && !question.options.some((option) => option.isCorrect)) throw new Error("Setiap soal multiple select harus memiliki minimal satu jawaban benar.");
    if (question.type === "SHORT_ANSWER" && !question.requiresManualReview && !question.acceptedAnswers.length) throw new Error("Soal short answer memerlukan kunci atau review manual.");
  }
  return prisma.assessment.update({ where: { id: assessmentId }, data: { isPublished: true } });
}
export async function createLearningGame(input: unknown) {
  await requireLearningManager();
  const parsed = CreateGameSchema.parse(input);
  const course = await prisma.course.findUnique({ where: { id: parsed.courseId }, select: { id: true, status: true } });
  if (!course || course.status === "PUBLISHED") throw new Error("Course tidak ditemukan atau sudah dipublikasikan.");
  if (parsed.chapterId) {
    const chapter = await prisma.courseChapter.findFirst({ where: { id: parsed.chapterId, courseId: parsed.courseId } });
    if (!chapter) throw new Error("Chapter bukan bagian dari course ini.");
  }
  if (parsed.lessonId) {
    const lesson = await prisma.lesson.findFirst({ where: { id: parsed.lessonId, chapterId: parsed.chapterId, chapter: { courseId: parsed.courseId } } });
    if (!lesson) throw new Error("Lesson bukan bagian dari chapter/course ini.");
  }
  return prisma.learningGame.create({
    data: {
      courseId: parsed.courseId, chapterId: parsed.chapterId, lessonId: parsed.lessonId,
      type: parsed.game.type, title: parsed.game.title, slug: parsed.slug,
      introduction: parsed.game.introduction, instructions: parsed.game.instructions,
      config: parsed.game.config as Prisma.InputJsonValue, scoringPolicy: parsed.game.scoring as Prisma.InputJsonValue,
      isRequired: parsed.isRequired, isPublished: parsed.isPublished, displayOrder: parsed.displayOrder,
    },
  });
}
export async function publishLearningGame(gameId: string) {
  await requireLearningManager();
  const game = await prisma.learningGame.findUnique({ where: { id: gameId }, include: { course: true } });
  if (!game || game.course.status === "PUBLISHED") throw new Error("Game tidak ditemukan atau course sudah dipublikasikan.");
  LearningGameConfigSchema.parse({
    type: game.type, title: game.title, introduction: game.introduction ?? "",
    instructions: game.instructions, config: game.config, scoring: game.scoringPolicy ?? undefined,
  });
  return prisma.learningGame.update({ where: { id: gameId }, data: { isPublished: true } });
}
