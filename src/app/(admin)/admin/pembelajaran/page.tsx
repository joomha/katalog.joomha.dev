import type { Metadata } from "next";
import Link from "next/link";
import { listAdminCourses } from "@/modules/learning/services";

export const metadata: Metadata = { title: "Learning Management | Joomha Admin" };
export default async function LearningAdminPage() {
  const courses = await listAdminCourses();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Agent 05 · LMS</p><h1 className="mt-1 text-2xl font-bold">Learning Management</h1><p className="mt-2 text-sm text-muted-foreground">Kelola course, kurikulum, assessment, game, tugas, dan sertifikat.</p></div>
        <div className="flex gap-2">
          <Link href="/admin/pembelajaran/tugas" className="rounded-md border px-4 py-2.5 text-sm font-semibold">Review tugas</Link>
          <Link href="/admin/pembelajaran/baru" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Buat course</Link>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_80px_100px] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground"><span>Course</span><span>Status</span><span>Chapter</span><span>Enrollment</span></div>
        {courses.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Belum ada course. Buat course dari listing kursus yang sudah tersedia di katalog.</p> :
          courses.map((course) => <Link key={course.id} href={"/admin/pembelajaran/" + course.slug} className="grid grid-cols-[minmax(0,1fr)_120px_80px_100px] items-center gap-3 border-b px-4 py-4 text-sm last:border-0 hover:bg-muted/30">
            <span className="min-w-0"><span className="block truncate font-medium">{course.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{course.slug}</span></span>
            <span className="text-xs">{course.status}</span><span>{course._count.chapters}</span><span>{course._count.enrollments}</span>
          </Link>)}
      </div>
    </div>
  );
}
