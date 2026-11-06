import "server-only";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events";
import { requireLearningUser } from "./identity.adapter";
import { loadChapterGateStates } from "./progression-query.service";
import { certificateEligibility } from "./progression.service";
import { issueCertificateRecord } from "./certificate.service";

export async function completeCourseEnrollment(courseId: string) {
  const user = await requireLearningUser();
  const enrollment = await prisma.learningEnrollment.findFirst({
    where: {
      courseId, userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] },
      accessStartsAt: { lte: new Date() },
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
    include: { course: true },
  });
  if (!enrollment) throw new Error("Enrollment aktif tidak ditemukan.");

  const [
    chapters, finalExams, assignments, totalRequiredLessons, completedRequiredLessons,
    existingCertificate,
  ] = await Promise.all([
    loadChapterGateStates(courseId, enrollment.id),
    prisma.assessment.findMany({
      where: { courseId, stage: "FINAL_EXAM", isPublished: true, isRequired: true },
      include: { attempts: { where: { enrollmentId: enrollment.id, passed: true }, select: { id: true } } },
    }),
    prisma.learningAssignment.findMany({
      where: { courseId, isPublished: true, isRequired: true },
      include: { submissions: { where: { enrollmentId: enrollment.id, status: "GRADED" }, select: { id: true } } },
    }),
    prisma.lesson.count({
      where: { isRequired: true, isPublished: true, chapter: { courseId, isRequired: true, isPublished: true } },
    }),
    prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, status: "COMPLETED", lesson: { isRequired: true, isPublished: true } },
    }),
    prisma.learningCertificate.findUnique({ where: { enrollmentId: enrollment.id }, select: { id: true } }),
  ]);

  const policy = (enrollment.course.certificatePolicy ?? {}) as {
    finalExamRequired?: boolean; minimumProgressPercentage?: number; requiredAssignments?: boolean;
  };
  const finalExamRequired = enrollment.course.certificateEnabled ? (policy.finalExamRequired ?? true) : false;
  const eligible = certificateEligibility({
    chapters,
    finalExamRequired,
    finalExamPassed: !finalExamRequired || (finalExams.length > 0 && finalExams.every((exam) => exam.attempts.length > 0)),
    assignmentsComplete: !(policy.requiredAssignments ?? false) || assignments.every((assignment) => assignment.submissions.length > 0),
    requiredLessonsComplete: completedRequiredLessons,
    requiredLessonsTotal: totalRequiredLessons,
    minimumProgress: policy.minimumProgressPercentage ?? 100,
  });
  if (!eligible.allowed) throw new Error("Kursus belum memenuhi syarat penyelesaian: " + eligible.reason);

  const completedAt = enrollment.completedAt ?? new Date();
  let newlyCompleted = false;
  if (enrollment.status === "ACTIVE") {
    const result = await prisma.learningEnrollment.updateMany({
      where: { id: enrollment.id, status: "ACTIVE" },
      data: { status: "COMPLETED", completedAt },
    });
    newlyCompleted = result.count === 1;
    if (!newlyCompleted) {
      const latest = await prisma.learningEnrollment.findUnique({ where: { id: enrollment.id } });
      if (latest?.status !== "COMPLETED") throw new Error("Status enrollment berubah selama proses penyelesaian.");
    }
  }

  if (newlyCompleted) {
    await eventBus.publish("CourseCompleted", {
      enrollmentId: enrollment.id, courseId, userId: user.id,
      courseTitle: enrollment.course.title, completedAt,
    }, enrollment.id);
  }

  let certificate = null;
  if (enrollment.course.certificateEnabled) {
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    certificate = existingCertificate
      ? await prisma.learningCertificate.findUnique({ where: { enrollmentId: enrollment.id } })
      : await issueCertificateRecord(enrollment.id, baseUrl);
    if (certificate && !existingCertificate) {
      await eventBus.publish("CertificateIssued", {
        certificateId: certificate.id, certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode, enrollmentId: enrollment.id, userId: user.id,
      }, certificate.id);
    }
  }
  return { enrollmentId: enrollment.id, completedAt, certificate, newlyCompleted };
}
