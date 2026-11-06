import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnrolledCoursePlayer } from "@/modules/learning/services";
import {
  markContentBlockViewedAction, markLessonCompletedAction, markLessonStartedAction,
  submitAssignmentAction, completeCourseAction,
} from "@/modules/learning/actions";
import { AssessmentRunner } from "@/modules/learning/components/assessment-runner";
import { LearningGameRunner } from "@/modules/learning/components/learning-game-runner";

type PageProps = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Pembelajaran " + slug + " | Joomha Education" };
}
export default async function EnrolledCoursePage({ params }: PageProps) {
  const { slug } = await params;
  let data;
  try {
    data = await getEnrolledCoursePlayer(slug);
  } catch {
    notFound();
  }
  if (!data) notFound();
  return (
    <div className="space-y-7">
      <div>
        <Link href="/akun/pembelajaran" className="text-sm text-primary hover:underline">← Pembelajaran Saya</Link>
        <h2 className="mt-2 text-2xl font-bold">{data.course.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Materi, assessment, game, dan progres tersimpan pada akun Anda.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border bg-card p-4">
          <h3 className="font-semibold">Daftar chapter</h3>
          <ol className="mt-4 space-y-3">
            {data.chapters.map((chapter, index) => <li key={chapter.id} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">{index + 1}.</span>
                <span className="font-medium">{chapter.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{chapter.isComplete ? "✓" : chapter.isUnlocked ? "Terbuka" : "Terkunci"}</span>
              </div>
              <ul className="mt-2 space-y-1 pl-5">{chapter.lessons.map((lesson) => <li key={lesson.id} className="text-xs text-muted-foreground">{lesson.isCompleted ? "✓ " : "• "}{lesson.title}</li>)}</ul>
            </li>)}
          </ol>
        </aside>
        <div className="space-y-5">
          {data.chapters.map((chapter, chapterIndex) => <section key={chapter.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Chapter {chapterIndex + 1}: {chapter.title}</h3>
              <span className={"rounded-full px-2.5 py-1 text-xs " + (chapter.isComplete ? "bg-green-100 text-green-800" : chapter.isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                {chapter.isComplete ? "Selesai" : chapter.isUnlocked ? "Terbuka" : "Terkunci"}
              </span>
            </div>
            {chapter.description && <p className="mt-2 text-sm text-muted-foreground">{chapter.description}</p>}
            {!chapter.isUnlocked ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Selesaikan semua prasyarat chapter sebelumnya untuk membuka chapter ini.</p> :
            <>
              {chapter.chapterAssessments.filter((assessment) => assessment.stage === "PRETEST").map((assessment) => <div key={assessment.id} className="mt-4 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold">{assessment.title}</h4><span className="text-xs text-muted-foreground">Pretest</span></div>
                <AssessmentRunner assessmentId={assessment.id} />
              </div>)}
              {!chapter.isLessonContentUnlocked && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Luluskan pretest wajib chapter ini sebelum membuka materi.</p>}
              {chapter.isLessonContentUnlocked && <>
                {chapter.lessons.map((lesson) => <article key={lesson.id} className="mt-5 rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h4 className="font-medium">{lesson.title}</h4>{lesson.description && <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>}</div>
                    <span className="text-xs text-muted-foreground">{lesson.isCompleted ? "Selesai" : "Belum selesai"}</span>
                  </div>
                  <form action={markLessonStartedAction} className="mt-3">
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button className="text-xs font-medium text-primary hover:underline">Mulai / lanjutkan lesson</button>
                  </form>
                  <div className="mt-4 space-y-3">
                    {lesson.contentBlocks.map((block) => <div key={block.id} className="rounded-md bg-muted/50 p-4">
                      <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.type}</span>{block.isCompleted && <span className="text-xs text-green-700">Selesai</span>}</div>
                      {block.title && <h5 className="mt-2 font-medium">{block.title}</h5>}
                      {block.type === "TEXT" && <p className="mt-2 whitespace-pre-line text-sm leading-7">{block.body}</p>}
                      {block.type === "VIDEO" && block.resourceUrl && <a href={block.resourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-primary hover:underline">Buka video pembelajaran</a>}
                      {block.type === "IMAGE" && block.resourceUrl && <img src={block.resourceUrl} alt={block.title ?? "Materi gambar"} className="mt-3 max-h-96 rounded-lg object-contain" />}
                      {block.type === "CODE" && <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100"><code>{block.body}</code></pre>}
                      {block.type === "FILE" && <p className="mt-2 text-sm text-muted-foreground">File privat belum diaktifkan; menunggu adapter file storage.</p>}
                      {block.type === "EMBED" && <p className="mt-2 text-sm text-muted-foreground">Konten embed hanya akan ditampilkan setelah domain diizinkan.</p>}
                      {block.type === "LINK" && block.resourceUrl && <a href={block.resourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-primary hover:underline">Buka tautan materi</a>}
                      <form action={markContentBlockViewedAction} className="mt-3">
                        <input type="hidden" name="contentBlockId" value={block.id} />
                        <button className="rounded-md border px-3 py-1.5 text-xs font-medium">{block.isCompleted ? "Perbarui status dibaca" : "Tandai materi selesai"}</button>
                      </form>
                    </div>)}
                  </div>
                  {lesson.assessments.map((assessment) => <div key={assessment.id} className="mt-4 rounded-lg border p-3">
                    <h5 className="text-sm font-semibold">{assessment.title}</h5><AssessmentRunner assessmentId={assessment.id} />
                  </div>)}
                  {lesson.isCompleted && lesson.games.map((game) => <div key={game.id} className="mt-4 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2"><h5 className="text-sm font-semibold">{game.title}</h5><span className="text-xs text-muted-foreground">{game.type.replaceAll("_", " ")}</span></div>
                    <LearningGameRunner gameId={game.id} />
                  </div>)}
                  {lesson.assignments.map((assignment) => <div key={assignment.id} className="mt-4 rounded-lg border p-3">
                    <h5 className="text-sm font-semibold">{assignment.title}</h5><p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{assignment.instructions}</p>
                    <form action={submitAssignmentAction} className="mt-3 space-y-2">
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <textarea name="responseText" rows={3} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tuliskan jawaban atau tautan berkas tugas..." />
                      <button className="rounded-md border px-3 py-2 text-xs font-semibold">Kirim tugas</button>
                    </form>
                  </div>)}
                  {!lesson.isCompleted && <form action={markLessonCompletedAction} className="mt-4">
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Selesaikan lesson</button>
                  </form>}
                </article>)}
              </>}
              {chapter.chapterAssessments.filter((assessment) => assessment.stage === "CHAPTER_EXAM").map((assessment) => <div key={assessment.id} className="mt-5 rounded-lg border p-3">
                <h4 className="text-sm font-semibold">{assessment.title}</h4>
                {assessment.isAvailable
                  ? <AssessmentRunner assessmentId={assessment.id} />
                  : <p className="mt-2 text-sm text-muted-foreground">Ujian chapter terbuka setelah semua lesson, posttest, game wajib, dan tugas wajib chapter ini selesai.</p>}
              </div>)}
            </>}
          </section>)}
          {data.finalAssessments.map((assessment) => <section key={assessment.id} className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Final exam: {assessment.title}</h3>
            {assessment.isAvailable
              ? <AssessmentRunner assessmentId={assessment.id} />
              : <p className="mt-2 text-sm text-muted-foreground">Selesaikan seluruh persyaratan chapter terlebih dahulu untuk membuka final exam.</p>}
          </section>)}
          {data.enrollment.status === "ACTIVE" && <form action={completeCourseAction} className="rounded-xl border bg-card p-5">
            <input type="hidden" name="courseId" value={data.course.id} />
            <h3 className="font-semibold">Selesaikan kursus</h3>
            <p className="mt-1 text-sm text-muted-foreground">Server memeriksa chapter gate, final exam, tugas wajib, dan progres sebelum menyelesaikan enrollment.</p>
            <button className="mt-4 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Periksa syarat penyelesaian</button>
          </form>}
          {data.certificate?.status === "ISSUED" && <section className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Sertifikat diterbitkan</h3><p className="mt-1 text-sm text-muted-foreground">Nomor: {data.certificate.certificateNumber}</p>
            <Link href={"/verifikasi-sertifikat/" + data.certificate.verificationCode} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Verifikasi / unduh sertifikat</Link>
          </section>}
        </div>
      </div>
    </div>
  );
}
