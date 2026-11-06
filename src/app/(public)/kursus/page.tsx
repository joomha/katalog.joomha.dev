import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { listPublishedCourses } from "@/modules/learning/services";

export const metadata: Metadata = { title: "Kursus Online | Joomha Education" };
export default async function CoursesPage() {
  const courses = await listPublishedCourses();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Joomha Learning</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Kursus Online</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Belajar bertahap melalui materi, latihan, evaluasi, dan progres yang tercatat.</p>
      {courses.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">Belum ada kursus yang dipublikasikan</h2>
          <p className="mt-2 text-sm text-muted-foreground">Kursus akan muncul setelah kurikulum siap dan listing katalog tersedia.</p>
          <Link href="/katalog?type=SELF_PACED_COURSE" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Lihat katalog kelas</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{course.level ?? "Kursus mandiri"}</span>
                <span className="text-xs text-muted-foreground">{course.chapterCount} chapter</span>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{course.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{course.shortDescription ?? course.description}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{course.lessonCount} lesson</span>
                <span>{course.estimatedDurationMinutes ? Math.round(course.estimatedDurationMinutes / 60) + " jam" : "Mandiri"}</span>
              </div>
              <Link href={"/kursus/" + course.slug} className="mt-5 inline-flex justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Lihat kurikulum</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
