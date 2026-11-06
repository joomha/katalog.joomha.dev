import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCourseBySlug } from "@/modules/learning/services";
import {
  createChapterAction, publishChapterAction, createLessonAction, publishLessonAction,
  createTextContentAction, createAssessmentJsonAction, publishAssessmentAction,
  createGameJsonAction, publishGameAction, createAssignmentJsonAction,
  publishAssignmentAction, publishCourseAction,
} from "@/modules/learning/actions";

type PageProps = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params; return { title: "Kelola " + slug + " | Joomha Admin" };
}
export default async function LearningCourseAdminPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getAdminCourseBySlug(slug);
  if (!course) notFound();
  const published = course.status === "PUBLISHED";
  const chapterId = course.chapters[0]?.id;
  const assessmentTemplate = {
    courseId: course.id, chapterId, stage: "CHAPTER_EXAM", title: "Ujian Chapter",
    policy: { passingScore: 70, maxAttempts: 3, timeLimitSeconds: 300, retryCooldownSeconds: 30, shuffleQuestions: true, shuffleOptions: true, showExplanation: true, allowReview: true, isRequired: true },
    questions: [{ type: "SINGLE_CHOICE", prompt: "Tulis pertanyaan di sini", points: 1, displayOrder: 0, isRequired: true, options: [{ optionKey: "A", label: "Opsi A", isCorrect: true, displayOrder: 0 }, { optionKey: "B", label: "Opsi B", isCorrect: false, displayOrder: 1 }] }],
  };
  const gameTemplate = {
    courseId: course.id, chapterId, slug: "game-baru", isRequired: false, isPublished: false, displayOrder: 0,
    game: { type: "MULTIPLE_CHOICE", title: "Game baru", introduction: "", instructions: "Pilih jawaban yang benar.",
      scoring: { pointsPerCorrect: 10, passingScore: 70, penalizeWrongAnswer: false },
      config: { questions: [{ id: "q1", prompt: "Tulis pertanyaan", options: [{ id: "a", text: "Opsi A" }, { id: "b", text: "Opsi B" }], correctOptionId: "a" }] } },
  };
  const assignmentTemplate = {
    courseId: course.id, chapterId, title: "Tugas baru", instructions: "Jelaskan instruksi tugas.",
    maxScore: 100, dueAfterDays: 7, allowLateSubmission: true, isRequired: false, isPublished: false, displayOrder: 0,
  };

  return (
    <div className="space-y-7">
      <div>
        <Link href="/admin/pembelajaran" className="text-sm text-primary hover:underline">← Learning Management</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">{course.title}</h1><p className="mt-1 text-sm text-muted-foreground">{course.slug} · {course.status} · {course._count.enrollments} enrollment</p></div>
          {!published && <form action={publishCourseAction}><input type="hidden" name="courseId" value={course.id} /><button className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Validasi & publikasikan</button></form>}
        </div>
      </div>
      {!published && <form action={createChapterAction} className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="courseSlug" value={course.slug} />
        <h2 className="font-semibold sm:col-span-2">Tambah chapter</h2>
        <label className="space-y-1 text-sm"><span>Judul</span><input name="title" required className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1 text-sm"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1 text-sm"><span>Urutan</span><input name="displayOrder" type="number" min="0" defaultValue={course.chapters.length} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1 text-sm"><span>Deskripsi</span><textarea name="description" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="pretestRequired" /> Wajib lulus pretest sebelum membuka materi chapter</label>
        <div className="sm:col-span-2"><button className="rounded-md border px-4 py-2 text-sm font-medium">Simpan chapter draft</button></div>
      </form>}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Struktur kurikulum</h2>
        {course.chapters.map((chapter, chapterIndex) => <article key={chapter.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-semibold">Chapter {chapterIndex + 1}: {chapter.title}</h3><p className="mt-1 text-xs text-muted-foreground">{chapter.slug} · {chapter.lessons.length} lesson</p></div>
            {!published && !chapter.isPublished && <form action={publishChapterAction}><input type="hidden" name="chapterId" value={chapter.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="rounded-md border px-3 py-2 text-xs font-semibold">Terbitkan chapter</button></form>}
          </div>
          {!published && <form action={createLessonAction} className="mt-4 grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-3">
            <input type="hidden" name="chapterId" value={chapter.id} /><input type="hidden" name="courseSlug" value={course.slug} />
            <input name="title" required placeholder="Judul lesson" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="slug" required placeholder="lesson-slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="displayOrder" type="number" min="0" defaultValue={chapter.lessons.length} className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="description" placeholder="Deskripsi (opsional)" className="rounded-md border bg-background px-3 py-2 text-sm sm:col-span-3" />
            <button className="justify-self-start rounded-md border px-3 py-2 text-xs font-semibold sm:col-span-3">Tambah lesson</button>
          </form>}
          <div className="mt-4 space-y-3">{chapter.lessons.map((lesson, lessonIndex) => <div key={lesson.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h4 className="text-sm font-medium">{chapterIndex + 1}.{lessonIndex + 1} {lesson.title}</h4><p className="mt-1 text-xs text-muted-foreground">{lesson._count.contentBlocks} content block · {lesson._count.assessments} assessment · {lesson._count.games} game · {lesson._count.assignments} tugas</p></div>
              {!published && !lesson.isPublished && <form action={publishLessonAction}><input type="hidden" name="lessonId" value={lesson.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="rounded-md border px-3 py-2 text-xs font-semibold">Terbitkan lesson</button></form>}
            </div>
            {!published && <form action={createTextContentAction} className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3">
              <input type="hidden" name="lessonId" value={lesson.id} /><input type="hidden" name="courseSlug" value={course.slug} />
              <p className="text-xs font-semibold">Tambah blok teks wajib</p><input name="title" required placeholder="Judul materi" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              <textarea name="body" required rows={4} placeholder="Isi materi..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              <button className="rounded-md border px-3 py-2 text-xs font-semibold">Simpan materi</button>
            </form>}
          </div>)}</div>
          {chapter.assessments.map((assessment: any) => <div key={assessment.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 p-3 text-sm">
            <span>{assessment.title} · {assessment.stage} · {assessment.isPublished ? "Published" : "Draft"}</span>
            {!published && !assessment.isPublished && <form action={publishAssessmentAction}><input type="hidden" name="assessmentId" value={assessment.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="text-xs font-semibold text-primary underline">Publish</button></form>}
          </div>)}
          {chapter.games.map((game: any) => <div key={game.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 p-3 text-sm">
            <span>{game.title} · {game.type} · {game.isPublished ? "Published" : "Draft"}</span>
            {!published && !game.isPublished && <form action={publishGameAction}><input type="hidden" name="gameId" value={game.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="text-xs font-semibold text-primary underline">Publish</button></form>}
          </div>)}
          {chapter.assignments.map((assignment: any) => <div key={assignment.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 p-3 text-sm">
            <span>{assignment.title} · {assignment.isPublished ? "Published" : "Draft"}</span>
            {!published && !assignment.isPublished && <form action={publishAssignmentAction}><input type="hidden" name="assignmentId" value={assignment.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="text-xs font-semibold text-primary underline">Publish</button></form>}
          </div>)}
        </article>)}
      </section>
      {!published && <section className="grid gap-4 lg:grid-cols-2">
        <form action={createAssessmentJsonAction} className="space-y-3 rounded-xl border bg-card p-5">
          <input type="hidden" name="courseSlug" value={course.slug} /><h2 className="font-semibold">Buat assessment</h2><p className="text-xs text-muted-foreground">Kunci jawaban tersimpan di server.</p>
          <textarea name="assessmentJson" rows={14} required defaultValue={JSON.stringify(assessmentTemplate, null, 2)} className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Simpan assessment</button>
        </form>
        <form action={createGameJsonAction} className="space-y-3 rounded-xl border bg-card p-5">
          <input type="hidden" name="courseSlug" value={course.slug} /><h2 className="font-semibold">Buat game</h2><p className="text-xs text-muted-foreground">Registry mendukung sembilan tipe game tervalidasi.</p>
          <textarea name="gameJson" rows={14} required defaultValue={JSON.stringify(gameTemplate, null, 2)} className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Simpan game</button>
        </form>
        <form action={createAssignmentJsonAction} className="space-y-3 rounded-xl border bg-card p-5 lg:col-span-2">
          <input type="hidden" name="courseSlug" value={course.slug} /><h2 className="font-semibold">Buat assignment</h2>
          <textarea name="assignmentJson" rows={8} required defaultValue={JSON.stringify(assignmentTemplate, null, 2)} className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Simpan assignment</button>
        </form>
      </section>}
      {course.assessments.map((assessment: any) => <div key={assessment.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm">
        <span>Final exam: {assessment.title} · {assessment.isPublished ? "Published" : "Draft"}</span>
        {!published && !assessment.isPublished && <form action={publishAssessmentAction}><input type="hidden" name="assessmentId" value={assessment.id} /><input type="hidden" name="courseSlug" value={course.slug} /><button className="text-xs text-primary underline">Publish</button></form>}
      </div>)}
    </div>
  );
}
