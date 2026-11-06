import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CourseAuthoringSchema, ChapterAuthoringSchema, LessonAuthoringSchema, LessonContentBlockSchema } from "../schemas/course.schema";
import { requireLearningManager, requireLearningUser } from "./identity.adapter";
import type { CourseSummary } from "../types";

const courseSummaryInclude = {
  _count: { select: { chapters: true, enrollments: true } },
  chapters: { where: { isPublished: true }, select: { lessons: { where: { isPublished: true }, select: { id: true } } } },
} as const;

function toSummary(course: {
  id: string; catalogItemId: string; slug: string; title: string; shortDescription: string | null;
  description: string; status: "DRAFT" | "COMING_SOON" | "PUBLISHED" | "ARCHIVED";
  level: string | null; estimatedDurationMinutes: number | null; learningOutcomes: string[];
  _count: { chapters: number; enrollments: number }; chapters: Array<{ lessons: Array<{ id: string }> }>;
}): CourseSummary {
  return {
    id: course.id, catalogItemId: course.catalogItemId, slug: course.slug,
    title: course.title, shortDescription: course.shortDescription, description: course.description,
    status: course.status, level: course.level, estimatedDurationMinutes: course.estimatedDurationMinutes,
    chapterCount: course._count.chapters,
    lessonCount: course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0),
    learningOutcomes: course.learningOutcomes,
  };
}

export async function listPublishedCourses() {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    include: courseSummaryInclude,
  });
  return rows.map(toSummary);
}

export async function getPublishedCourseBySlug(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null } },
    include: {
      chapters: {
        where: { isPublished: true }, orderBy: { displayOrder: "asc" },
        include: {
          lessons: {
            where: { isPublished: true }, orderBy: { displayOrder: "asc" },
            select: { id: true, title: true, slug: true, description: true, displayOrder: true, estimatedDurationMinutes: true },
          },
        },
      },
    },
  });
  if (!course) return null;
  const catalog = await prisma.catalogItem.findUnique({
    where: { id: course.catalogItemId }, select: { status: true, priceLabel: true },
  });
  return {
    id: course.id, slug: course.slug, title: course.title,
    shortDescription: course.shortDescription, description: course.description,
    level: course.level, estimatedDurationMinutes: course.estimatedDurationMinutes,
    learningOutcomes: course.learningOutcomes, prerequisites: course.prerequisites,
    certificateEnabled: course.certificateEnabled, enrollmentMode: course.enrollmentMode,
    catalogStatus: catalog?.status ?? "COMING_SOON", priceLabel: catalog?.priceLabel ?? null,
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id, slug: chapter.slug, title: chapter.title, description: chapter.description,
      displayOrder: chapter.displayOrder, lessonCount: chapter.lessons.length, lessons: chapter.lessons,
    })),
  };
}

export async function listAdminCourses() {
  await requireLearningManager();
  return prisma.course.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { _count: { select: { chapters: true, enrollments: true } } },
  });
}
export async function getAdminCourseBySlug(slug: string) {
  await requireLearningManager();
  return prisma.course.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { displayOrder: "asc" },
        include: {
          lessons: {
            orderBy: { displayOrder: "asc" },
            include: { _count: { select: { contentBlocks: true, assessments: true, games: true, assignments: true } } },
          },
          assessments: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, stage: true, isPublished: true } },
          games: { orderBy: { displayOrder: "asc" }, select: { id: true, title: true, type: true, isPublished: true } },
          assignments: { orderBy: { displayOrder: "asc" }, select: { id: true, title: true, isPublished: true } },
          _count: { select: { assessments: true, games: true, assignments: true } },
        },
      },
      assessments: { where: { stage: "FINAL_EXAM" }, select: { id: true, title: true, isPublished: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function createCourse(input: unknown) {
  const actor = await requireLearningManager();
  const parsed = CourseAuthoringSchema.parse(input);
  const catalog = await prisma.catalogItem.findUnique({ where: { id: parsed.catalogItemId } });
  if (!catalog || catalog.type !== "SELF_PACED_COURSE") throw new Error("Course harus terhubung ke listing SELF_PACED_COURSE yang valid.");
  if (catalog.slug !== parsed.slug) throw new Error("Slug Course harus sama dengan slug CatalogItem.");
  return prisma.course.create({
    data: {
      catalogItemId: parsed.catalogItemId, slug: parsed.slug, title: parsed.title,
      shortDescription: parsed.shortDescription ?? catalog.shortDescription,
      description: parsed.description, status: "DRAFT",
      enrollmentMode: parsed.enrollmentMode, language: parsed.language,
      level: parsed.level ?? catalog.level, estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      accessDurationDays: parsed.accessDurationDays,
      learningOutcomes: parsed.learningOutcomes, prerequisites: parsed.prerequisites,
      certificateEnabled: parsed.certificateEnabled,
      certificatePolicy: parsed.certificatePolicy as Prisma.InputJsonValue,
      createdByUserId: actor.id, updatedByUserId: actor.id,
    },
  });
}
export async function updateCourse(courseId: string, input: unknown) {
  const actor = await requireLearningManager();
  const parsed = CourseAuthoringSchema.partial().omit({ catalogItemId: true, slug: true }).parse(input);
  const current = await prisma.course.findUnique({ where: { id: courseId } });
  if (!current) throw new Error("Course tidak ditemukan.");
  if (parsed.status === "PUBLISHED") throw new Error("Gunakan publishCourse agar seluruh syarat publikasi diverifikasi.");
  return prisma.course.update({
    where: { id: courseId },
    data: {
      ...parsed,
      certificatePolicy: parsed.certificatePolicy === undefined ? undefined : parsed.certificatePolicy as Prisma.InputJsonValue,
      updatedByUserId: actor.id,
    },
  });
}

export async function publishCourse(courseId: string) {
  const actor = await requireLearningManager();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course tidak ditemukan.");
  const catalog = await prisma.catalogItem.findUnique({ where: { id: course.catalogItemId } });
  if (!catalog || catalog.type !== "SELF_PACED_COURSE" || catalog.status !== "AVAILABLE") {
    throw new Error("CatalogItem harus berstatus AVAILABLE sebelum LMS dipublikasikan.");
  }
  const chapters = await prisma.courseChapter.findMany({
    where: { courseId, isRequired: true },
    include: {
      lessons: { where: { isRequired: true }, include: { contentBlocks: { where: { isRequired: true } } } },
      assessments: { where: { isPublished: true, isRequired: true, stage: { in: ["PRETEST", "CHAPTER_EXAM"] } } },
    },
  });
  if (!chapters.length) throw new Error("Course memerlukan minimal satu chapter wajib.");
  for (const chapter of chapters) {
    if (!chapter.isPublished || !chapter.lessons.length) throw new Error("Setiap chapter wajib dan lesson-nya harus diterbitkan.");
    if (chapter.lessons.some((lesson) => !lesson.isPublished)) {
      throw new Error("Semua lesson wajib dalam chapter harus diterbitkan sebelum course.");
    }
    const gatePolicy = (chapter.gatePolicy ?? {}) as { requireChapterExamPassed?: boolean };
    const chapterExam = chapter.assessments.some((assessment) => assessment.stage === "CHAPTER_EXAM");
    const pretest = chapter.assessments.some((assessment) => assessment.stage === "PRETEST");
    if (gatePolicy.pretestRequiredBeforeLessons && !pretest) {
      throw new Error("Chapter yang mewajibkan pretest harus memiliki pretest wajib yang sudah diterbitkan.");
    }
    if ((gatePolicy.requireChapterExamPassed ?? true) && !chapterExam) {
      throw new Error("Setiap chapter gate wajib memiliki chapter exam yang diterbitkan.");
    }
    if (chapter.lessons.some((lesson) => lesson.contentBlocks.length === 0)) {
      throw new Error("Setiap lesson wajib memiliki minimal satu content block wajib.");
    }
  }
  const certificatePolicy = (course.certificatePolicy ?? {}) as { finalExamRequired?: boolean; requiredAssignments?: boolean };
  if (certificatePolicy.requiredAssignments) {
    const assignmentCount = await prisma.learningAssignment.count({
      where: { courseId, isPublished: true, isRequired: true },
    });
    if (assignmentCount === 0) throw new Error("Course mewajibkan assignment untuk sertifikat tetapi belum memiliki assignment wajib yang diterbitkan.");
  }
  if (course.certificateEnabled && (policy.finalExamRequired ?? true)) {
    const count = await prisma.assessment.count({ where: { courseId, stage: "FINAL_EXAM", isPublished: true, isRequired: true } });
    if (!count) throw new Error("Course dengan sertifikat wajib memiliki final exam.");
  }
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date(), updatedByUserId: actor.id },
  });
}

export async function createChapter(input: unknown) {
  await requireLearningManager();
  const parsed = ChapterAuthoringSchema.parse(input);
  const course = await prisma.course.findUnique({ where: { id: parsed.courseId } });
  if (!course || course.status === "PUBLISHED") throw new Error("Course tidak ditemukan atau sudah dipublikasikan.");
  return prisma.courseChapter.create({
    data: { ...parsed, gatePolicy: parsed.gatePolicy as Prisma.InputJsonValue },
  });
}
export async function publishChapter(chapterId: string) {
  await requireLearningManager();
  const chapter = await prisma.courseChapter.findUnique({
    where: { id: chapterId },
    include: {
      course: true, lessons: { where: { isPublished: true } },
      assessments: { where: { isPublished: true, isRequired: true, stage: "CHAPTER_EXAM" } },
    },
  });
  if (!chapter || chapter.course.status === "PUBLISHED") throw new Error("Chapter tidak ditemukan atau course sudah dipublikasikan.");
  if (!chapter.lessons.length) throw new Error("Terbitkan minimal satu lesson sebelum chapter.");
  const policy = (chapter.gatePolicy ?? {}) as { requireChapterExamPassed?: boolean };
  if ((policy.requireChapterExamPassed ?? true) && chapter.assessments.length === 0) throw new Error("Chapter ini memerlukan chapter exam yang diterbitkan.");
  return prisma.courseChapter.update({ where: { id: chapterId }, data: { isPublished: true } });
}
export async function createLesson(input: unknown) {
  await requireLearningManager();
  const parsed = LessonAuthoringSchema.parse(input);
  const chapter = await prisma.courseChapter.findUnique({ where: { id: parsed.chapterId }, include: { course: true } });
  if (!chapter || chapter.course.status === "PUBLISHED") throw new Error("Chapter tidak ditemukan atau course sudah dipublikasikan.");
  return prisma.lesson.create({ data: parsed });
}
export async function publishLesson(lessonId: string) {
  await requireLearningManager();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }, include: { chapter: { include: { course: true } }, contentBlocks: { where: { isRequired: true } } },
  });
  if (!lesson || lesson.chapter.course.status === "PUBLISHED") throw new Error("Lesson tidak ditemukan atau course sudah dipublikasikan.");
  if (!lesson.contentBlocks.length) throw new Error("Lesson memerlukan minimal satu content block wajib.");
  return prisma.lesson.update({ where: { id: lessonId }, data: { isPublished: true } });
}
export async function createLessonContentBlock(input: unknown) {
  await requireLearningManager();
  const parsed = LessonContentBlockSchema.parse(input);
  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.lessonId }, include: { chapter: { include: { course: true } } },
  });
  if (!lesson || lesson.chapter.course.status === "PUBLISHED") throw new Error("Lesson tidak ditemukan atau course sudah dipublikasikan.");
  if (parsed.type === "FILE" && !parsed.storageKey) throw new Error("File kursus harus memakai storage key privat.");
  return prisma.lessonContentBlock.create({
    data: {
      ...parsed,
      metadata: parsed.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getCurrentStudentCourses() {
  const user = await requireLearningUser();
  const enrollments = await prisma.learningEnrollment.findMany({
    where: {
      userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] }, accessStartsAt: { lte: new Date() },
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true, slug: true, title: true, shortDescription: true, level: true,
          chapters: { where: { isPublished: true }, select: { lessons: { where: { isPublished: true }, select: { id: true } } } },
        },
      },
      lessonProgress: { where: { status: "COMPLETED" }, select: { lessonId: true } },
    },
  });
  return enrollments.map((enrollment) => {
    const totalLessons = enrollment.course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
    const completedLessons = enrollment.lessonProgress.length;
    return {
      id: enrollment.id, courseId: enrollment.course.id, slug: enrollment.course.slug,
      title: enrollment.course.title, shortDescription: enrollment.course.shortDescription,
      level: enrollment.course.level, totalLessons, completedLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round(completedLessons / totalLessons * 100),
      status: enrollment.status,
    };
  });
}
