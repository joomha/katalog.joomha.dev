import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requireLearningManager, requireLearningUser } from "./identity.adapter";
import { loadChapterGateStates } from "./progression-query.service";
import { certificateEligibility } from "./progression.service";

export async function verifyCertificate(verificationCode: string) {
  if (!/^[a-f0-9]{36}$/.test(verificationCode)) return null;
  const certificate = await prisma.learningCertificate.findUnique({
    where: { verificationCode },
    select: {
      certificateNumber: true, verificationCode: true, status: true,
      participantNameSnapshot: true, courseTitleSnapshot: true, issuerNameSnapshot: true,
      issuedAt: true, revokedAt: true, revocationReason: true,
    },
  });
  if (!certificate) return null;
  return { ...certificate, isValid: certificate.status === "ISSUED" && certificate.issuedAt !== null && certificate.revokedAt === null };
}

export async function listMyCertificates() {
  const user = await requireLearningUser();
  return prisma.learningCertificate.findMany({
    where: { enrollment: { userId: user.id }, status: { in: ["ISSUED", "REVOKED"] } },
    orderBy: { issuedAt: "desc" },
    select: {
      certificateNumber: true, verificationCode: true, status: true,
      participantNameSnapshot: true, courseTitleSnapshot: true, issuerNameSnapshot: true,
      issuedAt: true, verificationUrl: true,
    },
  });
}

export async function issueCertificateRecord(enrollmentId: string, verificationBaseUrl: string) {
  const enrollment = await prisma.learningEnrollment.findUnique({
    where: { id: enrollmentId }, include: { course: true },
  });
  if (!enrollment || enrollment.status !== "COMPLETED" || !enrollment.course.certificateEnabled) {
    throw new Error("Enrollment belum memenuhi syarat penerbitan sertifikat.");
  }
  const existing = await prisma.learningCertificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;

  const [
    chapters, finalExams, assignments, totalRequiredLessons, completedRequiredLessons, user,
  ] = await Promise.all([
    loadChapterGateStates(enrollment.courseId, enrollment.id),
    prisma.assessment.findMany({
      where: { courseId: enrollment.courseId, stage: "FINAL_EXAM", isPublished: true, isRequired: true },
      include: { attempts: { where: { enrollmentId, passed: true }, select: { id: true } } },
    }),
    prisma.learningAssignment.findMany({
      where: { courseId: enrollment.courseId, isPublished: true, isRequired: true },
      include: { submissions: { where: { enrollmentId, status: "GRADED" }, select: { id: true } } },
    }),
    prisma.lesson.count({
      where: { isRequired: true, isPublished: true, chapter: { courseId: enrollment.courseId, isRequired: true, isPublished: true } },
    }),
    prisma.lessonProgress.count({
      where: { enrollmentId, status: "COMPLETED", lesson: { isRequired: true, isPublished: true } },
    }),
    prisma.user.findUnique({ where: { id: enrollment.userId }, select: { name: true } }),
  ]);
  if (!user) throw new Error("Data peserta tidak ditemukan.");

  const policy = (enrollment.course.certificatePolicy ?? {}) as {
    finalExamRequired?: boolean; minimumProgressPercentage?: number; requiredAssignments?: boolean;
  };
  const finalExamRequired = policy.finalExamRequired ?? true;
  const eligible = certificateEligibility({
    chapters,
    finalExamRequired,
    finalExamPassed: !finalExamRequired || (finalExams.length > 0 && finalExams.every((exam) => exam.attempts.length > 0)),
    assignmentsComplete: !(policy.requiredAssignments ?? false) || assignments.every((assignment) => assignment.submissions.length > 0),
    requiredLessonsComplete: completedRequiredLessons,
    requiredLessonsTotal: totalRequiredLessons,
    minimumProgress: policy.minimumProgressPercentage ?? 100,
  });
  if (!eligible.allowed) throw new Error("Syarat sertifikat belum terpenuhi: " + eligible.reason);

  const verificationCode = randomBytes(18).toString("hex");
  const certificateNumber = "JH-" + new Date().getUTCFullYear() + "-" + randomBytes(5).toString("hex").toUpperCase();
  try {
    return await prisma.learningCertificate.create({
      data: {
        enrollmentId, certificateNumber, verificationCode, status: "ISSUED",
        participantNameSnapshot: user.name,
        courseTitleSnapshot: enrollment.course.title,
        issuerNameSnapshot: process.env.CERTIFICATE_ISSUER_NAME ?? "Joomha Education",
        issuedAt: new Date(),
        verificationUrl: verificationBaseUrl.replace(/\/$/, "") + "/verifikasi-sertifikat/" + verificationCode,
      },
    });
  } catch (error) {
    const duplicate = await prisma.learningCertificate.findUnique({ where: { enrollmentId } });
    if (duplicate) return duplicate;
    throw error;
  }
}

export async function issueCertificateManually(enrollmentId: string, verificationBaseUrl: string) {
  await requireLearningManager();
  return issueCertificateRecord(enrollmentId, verificationBaseUrl);
}

export async function revokeCertificate(certificateId: string, reason: string) {
  await requireLearningManager();
  const normalized = reason.trim();
  if (!normalized) throw new Error("Alasan pencabutan sertifikat wajib diisi.");
  const certificate = await prisma.learningCertificate.findUnique({ where: { id: certificateId } });
  if (!certificate || certificate.status !== "ISSUED") throw new Error("Sertifikat tidak ditemukan atau sudah dicabut.");
  return prisma.learningCertificate.update({
    where: { id: certificateId },
    data: { status: "REVOKED", revokedAt: new Date(), revocationReason: normalized },
  });
}
