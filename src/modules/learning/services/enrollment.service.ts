import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireLearningUser } from "./identity.adapter";

export interface PaidOrderItem { catalogItemId: string; quantity?: number; }
export interface OrderPaidPayload { orderId: string; userId: string; items: PaidOrderItem[]; }

/** Idempotent: one enrollment per course/user; orderId retained for audit. */
export async function enrollFromPaidOrder(payload: OrderPaidPayload) {
  if (!payload.orderId || !payload.userId || !Array.isArray(payload.items)) throw new Error("Payload OrderPaid tidak valid.");
  const catalogIds = [...new Set(payload.items.map((item) => item.catalogItemId).filter(Boolean))];
  if (!catalogIds.length) return { created: 0, skipped: 0 };
  const courses = await prisma.course.findMany({
    where: { catalogItemId: { in: catalogIds }, status: "PUBLISHED" },
    select: { id: true, catalogItemId: true, accessDurationDays: true },
  });
  const now = new Date();
  const rows = courses.map((course) => ({
    courseId: course.id, userId: payload.userId, orderId: payload.orderId,
    enrolledAt: now, accessStartsAt: now,
    accessExpiresAt: course.accessDurationDays ? new Date(now.getTime() + course.accessDurationDays * 86_400_000) : null,
    status: "ACTIVE" as const,
  }));
  if (!rows.length) return { created: 0, skipped: catalogIds.length };
  const result = await prisma.learningEnrollment.createMany({ data: rows, skipDuplicates: true });
  return { created: result.count, skipped: catalogIds.length - result.count };
}
export async function enrollCurrentUserInOpenCourse(courseId: string) {
  const user = await requireLearningUser();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED" || course.enrollmentMode !== "OPEN") {
    throw new Error("Kursus ini tidak mendukung pendaftaran terbuka.");
  }
  return prisma.learningEnrollment.upsert({
    where: { courseId_userId: { courseId, userId: user.id } },
    create: { courseId, userId: user.id, status: "ACTIVE" },
    update: {},
  });
}
