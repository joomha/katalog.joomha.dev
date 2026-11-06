import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentStudentCourses } from "@/modules/learning/services";

export const metadata: Metadata = { title: "Pembelajaran Saya | Joomha Education" };
export default async function MyLearningPage() {
  const courses = await getCurrentStudentCourses();
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Learning dashboard</p><h2 className="mt-1 text-2xl font-bold">Pembelajaran Saya</h2><p className="mt-2 text-sm text-muted-foreground">Kursus yang dapat Anda lanjutkan berdasarkan enrollment yang tercatat.</p></div>
      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <h3 className="font-semibold">Belum ada kursus</h3><p className="mt-2 text-sm text-muted-foreground">Kursus akan muncul setelah pembayaran diverifikasi atau pendaftaran terbuka berhasil.</p>
          <Link href="/katalog?type=SELF_PACED_COURSE" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Jelajahi kursus</Link>
        </div>
      ) : <div className="grid gap-4 lg:grid-cols-2">
        {courses.map((course) => <article key={course.id} className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{course.title}</h3><p className="mt-1 text-sm text-muted-foreground">{course.shortDescription}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{course.level ?? "Mandiri"}</span></div>
          <div className="mt-5 flex justify-between text-xs text-muted-foreground"><span>Progres</span><span>{course.completedLessons}/{course.totalLessons} lesson · {course.progressPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: course.progressPercent + "%" }} /></div>
          <Link href={"/akun/pembelajaran/" + course.slug} className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Lanjutkan belajar</Link>
        </article>)}
      </div>}
    </div>
  );
}
