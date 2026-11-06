import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireLearningManager } from "@/modules/learning/services/identity.adapter";
import { createCourseAction } from "@/modules/learning/actions";

export const metadata: Metadata = { title: "Buat Course | Joomha Admin" };
export default async function NewLearningCoursePage() {
  await requireLearningManager();
  const [items, existing] = await Promise.all([
    prisma.catalogItem.findMany({ where: { type: "SELF_PACED_COURSE" }, orderBy: { title: "asc" }, select: { id: true, title: true, slug: true, status: true } }),
    prisma.course.findMany({ select: { catalogItemId: true } }),
  ]);
  const used = new Set(existing.map((course) => course.catalogItemId));
  const available = items.filter((item) => !used.has(item.id));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><Link href="/admin/pembelajaran" className="text-sm text-primary hover:underline">← Learning Management</Link><h1 className="mt-2 text-2xl font-bold">Buat course LMS</h1><p className="mt-2 text-sm text-muted-foreground">Course harus mengacu ke listing SELF_PACED_COURSE Agent 03. Slug mengikuti listing katalog.</p></div>
      <form action={createCourseAction} className="space-y-4 rounded-xl border bg-card p-5">
        <label className="block space-y-2 text-sm"><span className="font-medium">Listing katalog</span><select name="catalogItemId" required className="w-full rounded-md border bg-background px-3 py-2.5"><option value="">Pilih listing kursus</option>{available.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.status} · {item.slug}</option>)}</select></label>
        <label className="block space-y-2 text-sm"><span className="font-medium">Judul course (opsional)</span><input name="title" placeholder="Gunakan judul listing bila kosong" className="w-full rounded-md border bg-background px-3 py-2.5" /></label>
        <label className="block space-y-2 text-sm"><span className="font-medium">Deskripsi (opsional)</span><textarea name="description" rows={4} placeholder="Gunakan deskripsi listing bila kosong" className="w-full rounded-md border bg-background px-3 py-2.5" /></label>
        <button disabled={available.length === 0} className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Buat draft course</button>
        {available.length === 0 && <p className="text-sm text-muted-foreground">Semua listing sudah memiliki course atau belum ada listing kursus.</p>}
      </form>
    </div>
  );
}
