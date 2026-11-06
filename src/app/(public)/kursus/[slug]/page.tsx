import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCourseBySlug } from "@/modules/learning/services";
import { enrollOpenCourseAction } from "@/modules/learning/actions";

type PageProps = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  return { title: course ? course.title + " | Joomha Education" : "Kursus tidak ditemukan" };
}
export default async function CourseOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/kursus" className="text-sm font-medium text-primary hover:underline">← Semua kursus</Link>
      <section className="mt-6 rounded-2xl border bg-card p-6 sm:p-9">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{course.level ?? "Kursus mandiri"}</span>
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{course.chapters.length} chapter</span>
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{course.chapters.reduce((n, chapter) => n + chapter.lessonCount, 0)} lesson</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{course.description}</p>
        {course.enrollmentMode === "OPEN" ? (
          <form action={enrollOpenCourseAction} className="mt-7">
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="slug" value={course.slug} />
            <button className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Daftar dan mulai belajar</button>
          </form>
        ) : (
          <div className="mt-7 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {course.catalogStatus === "AVAILABLE"
              ? <>Pembelian dilakukan melalui listing katalog. <Link className="font-semibold text-primary hover:underline" href={"/katalog/" + course.slug}>Lihat listing dan opsi pembelian</Link></>
              : "Pendaftaran akan dibuka setelah listing dan pembayaran diaktifkan."}
          </div>
        )}
      </section>
      {course.learningOutcomes.length > 0 && <section className="mt-10">
        <h2 className="text-xl font-semibold">Yang akan dipelajari</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">{course.learningOutcomes.map((item) => <li key={item} className="rounded-lg border bg-card p-4 text-sm">{item}</li>)}</ul>
      </section>}
      {course.prerequisites.length > 0 && <section className="mt-8">
        <h2 className="text-lg font-semibold">Prasyarat</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Kurikulum</h2>
        <div className="mt-4 space-y-4">{course.chapters.map((chapter, index) => (
          <article key={chapter.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Chapter {index + 1}. {chapter.title}</h3><span className="text-xs text-muted-foreground">{chapter.lessonCount} lesson</span></div>
            {chapter.description && <p className="mt-2 text-sm text-muted-foreground">{chapter.description}</p>}
            <ol className="mt-4 space-y-2">{chapter.lessons.map((lesson) => <li key={lesson.id} className="flex gap-3 text-sm"><span className="text-primary">•</span>{lesson.title}</li>)}</ol>
          </article>
        ))}</div>
      </section>
      <p className="mt-10 text-xs leading-5 text-muted-foreground">Sertifikat yang diterbitkan adalah bukti penyelesaian internal Joomha Education, bukan sertifikasi kompetensi resmi/BNSP.</p>
    </main>
  );
}
