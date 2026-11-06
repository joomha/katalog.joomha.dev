import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { listPendingAssignmentSubmissions } from "@/modules/learning/services";
import { gradeAssignmentAction } from "@/modules/learning/actions";

export const metadata: Metadata = { title: "Review Tugas | Joomha Admin" };

export default async function LearningAssignmentsPage() {
  const submissions = await listPendingAssignmentSubmissions();
  const userIds = [...new Set(submissions.map((submission) => submission.enrollment.userId))];
  const users = userIds.length ? await prisma.user.findMany({
    where: { id: { in: userIds } }, select: { id: true, name: true, email: true },
  }) : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Learning Management</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Review Tugas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Periksa jawaban peserta, beri nilai, dan sampaikan feedback.</p>
      </div>
      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Tidak ada tugas yang menunggu review.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const student = userById.get(submission.enrollment.userId);
            return (
              <article key={submission.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{submission.assignment.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{submission.assignment.course.title} · {student?.name ?? "Peserta"} · {student?.email ?? submission.enrollment.userId}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{submission.status}</span>
                </div>
                {submission.responseText && <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-6">{submission.responseText}</div>}
                <p className="mt-3 text-xs text-muted-foreground">Dikirim {submission.submittedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · Nilai maksimum {Number(submission.assignment.maxScore)}</p>
                <form action={gradeAssignmentAction} className="mt-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:items-end">
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <label className="space-y-1 text-xs"><span className="font-medium">Nilai</span><input name="score" type="number" min="0" max={Number(submission.assignment.maxScore)} step="0.5" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>
                  <label className="space-y-1 text-xs"><span className="font-medium">Feedback</span><textarea name="feedback" required rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tulis masukan yang spesifik dan membangun..." /></label>
                  <button className="rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">Simpan penilaian</button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
