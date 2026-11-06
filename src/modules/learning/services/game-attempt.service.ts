import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GameSubmissionSchema, LearningGameConfigSchema } from "../schemas/game.schema";
import { gradeLearningGame, toPublicGameConfig } from "./game-engine";
import { requireLearningUser } from "./identity.adapter";
import { getActiveEnrollmentForCourse, loadChapterGateStates } from "./progression-query.service";
import { canAccessChapter } from "./progression.service";

function toJson(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Data jawaban tidak valid.");
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}
function parseConfig(game: { type: string; title: string; introduction: string | null; instructions: string; config: Prisma.JsonValue; scoringPolicy: Prisma.JsonValue | null }) {
  return LearningGameConfigSchema.parse({ type: game.type, title: game.title, introduction: game.introduction ?? "", instructions: game.instructions, config: game.config, scoring: game.scoringPolicy ?? undefined });
}
export async function startGameAttempt(gameId: string) {
  const user = await requireLearningUser();
  const game = await prisma.learningGame.findFirst({ where: { id: gameId, isPublished: true } });
  if (!game) throw new Error("Game tidak ditemukan atau belum diterbitkan.");
  const enrollment = await getActiveEnrollmentForCourse(game.courseId, user.id);
  if (!enrollment || enrollment.status !== "ACTIVE") throw new Error("Enrollment aktif tidak ditemukan.");
  if (game.chapterId) {
    const gates = await loadChapterGateStates(game.courseId, enrollment.id);
    const index = gates.findIndex((chapter) => chapter.id === game.chapterId);
    if (!canAccessChapter(index, gates).allowed) throw new Error("Chapter masih terkunci.");
  }
  if (game.lessonId) {
    const progress = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: game.lessonId } },
    });
    if (progress?.status !== "COMPLETED") throw new Error("Selesaikan lesson dan posttest sebelum memulai game.");
  }
  const config = parseConfig(game);
  const active = await prisma.learningGameAttempt.findFirst({ where: { enrollmentId: enrollment.id, gameId, status: "IN_PROGRESS" } });
  if (active) throw new Error("Anda masih memiliki attempt game yang berjalan.");
  const attemptNumber = await prisma.learningGameAttempt.count({ where: { enrollmentId: enrollment.id, gameId } }) + 1;
  const attempt = await prisma.learningGameAttempt.create({
    data: { enrollmentId: enrollment.id, gameId, attemptNumber, status: "IN_PROGRESS" },
  });
  return { attemptId: attempt.id, startedAt: attempt.startedAt, game: toPublicGameConfig(config) };
}
export async function submitGameAttempt(attemptId: string, raw: unknown) {
  const user = await requireLearningUser();
  const parsed = GameSubmissionSchema.parse(raw);
  const attempt = await prisma.learningGameAttempt.findUnique({
    where: { id: attemptId }, include: { enrollment: { select: { userId: true } }, game: true },
  });
  if (!attempt || attempt.enrollment.userId !== user.id) throw new Error("Attempt game tidak ditemukan.");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt game sudah diselesaikan.");
  const config = parseConfig(attempt.game);
  const elapsedMs = Math.max(0, Date.now() - attempt.startedAt.getTime());
  const grade = gradeLearningGame(config, parsed.answers, elapsedMs);
  const updated = await prisma.learningGameAttempt.updateMany({
    where: { id: attempt.id, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED", completedAt: new Date(), answers: toJson(parsed.answers),
      score: grade.score, maxScore: grade.maxScore, passed: grade.passed, durationMs: elapsedMs,
    },
  });
  if (updated.count !== 1) throw new Error("Attempt game telah diproses oleh permintaan lain.");
  return grade;
}
