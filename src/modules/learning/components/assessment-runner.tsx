"use client";

import { useEffect, useState, useTransition } from "react";
import { startAssessmentAttemptAction, submitAssessmentAttemptAction } from "@/modules/learning/actions";

type Option = { id: string; label: string };
type Question = { id: string; type: string; prompt: string; points: number; options: Option[] };
type Attempt = { attemptId: string; title: string; stage: string; instructions: string | null; questions: Question[]; deadlineAt: string | Date | null };
type Result = {
  score: number; earnedPoints: number; maxPoints: number; passed: boolean; pendingReview: boolean;
  questionResults?: Array<{ questionId: string; isCorrect: boolean | null; explanation: string | null }>;
};
function formatSeconds(total: number) {
  const safe = Math.max(0, total);
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}

export function AssessmentRunner({ assessmentId }: { assessmentId: string }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    if (!attempt?.deadlineAt) { setSecondsLeft(null); return; }
    const deadline = new Date(attempt.deadlineAt).getTime();
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1_000)));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [attempt?.deadlineAt]);

  const setAnswer = (id: string, value: unknown) => setAnswers((current) => ({ ...current, [id]: value }));
  const start = () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await startAssessmentAttemptAction(assessmentId);
        setAttempt(data as Attempt);
        setAnswers({});
        setResult(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Assessment tidak dapat dimulai.");
      }
    });
  };
  const submit = () => {
    if (!attempt) return;
    const payload = Object.entries(answers).map(([questionId, value]) => {
      if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try { return { questionId, answer: JSON.parse(value) as unknown }; } catch { /* Treat as plain text. */ }
      }
      return { questionId, answer: value };
    });
    setError(null);
    startTransition(async () => {
      try {
        const data = await submitAssessmentAttemptAction(attempt.attemptId, payload);
        setResult(data as Result);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Jawaban tidak dapat dikirim.");
      }
    });
  };

  if (result) return (
    <section className="mt-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">Hasil assessment</h4>
        <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (result.passed ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>
          {result.pendingReview ? "Menunggu review instruktur" : result.passed ? "Lulus" : "Belum lulus"}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{result.score.toFixed(1)}%</p>
      <p className="mt-1 text-xs text-muted-foreground">{result.earnedPoints} dari {result.maxPoints} poin</p>
      {result.questionResults?.filter((row) => row.explanation).map((row) => (
        <p key={row.questionId} className="mt-2 text-xs leading-5 text-muted-foreground">{row.explanation}</p>
      ))}
      <button type="button" onClick={() => { setAttempt(null); setResult(null); }} className="mt-4 text-sm font-medium text-primary hover:underline">Tutup hasil</button>
    </section>
  );

  if (!attempt) return (
    <section className="mt-4 rounded-lg border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment</p>
      <p className="mt-1 text-sm">Mulai untuk membuka soal dan pilihan yang diacak sesuai kebijakan.</p>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      <button type="button" disabled={busy} onClick={start} className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? "Memulai..." : "Mulai assessment"}
      </button>
    </section>
  );

  return (
    <section className="mt-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{attempt.stage.replaceAll("_", " ")}</p>
          <h4 className="mt-1 font-semibold">{attempt.title}</h4>
        </div>
        {attempt.deadlineAt && <span className={"font-mono text-sm font-bold " + (secondsLeft === 0 ? "text-red-600" : "text-primary")}>{formatSeconds(secondsLeft ?? 0)}</span>}
      </div>
      {attempt.instructions && <p className="mt-2 text-sm text-muted-foreground">{attempt.instructions}</p>}
      <div className="mt-4 space-y-5">
        {attempt.questions.map((question, index) => (
          <fieldset key={question.id} className="space-y-3 rounded-lg bg-muted/40 p-3">
            <legend className="px-1 text-sm font-medium">{index + 1}. {question.prompt}</legend>
            {["SINGLE_CHOICE", "TRUE_FALSE"].includes(question.type) && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswer(question.id, option.id)} className="mt-1" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
            {question.type === "MULTIPLE_SELECT" && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
                  return (
                    <label key={option.id} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => setAnswer(question.id, event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} className="mt-1" />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {question.type === "SHORT_ANSWER" && (
              <textarea value={String(answers[question.id] ?? "")} onChange={(event) => setAnswer(question.id, event.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Tulis jawaban..." />
            )}
            {["MATCHING", "ORDERING"].includes(question.type) && (
              <textarea value={String(answers[question.id] ?? "")} onChange={(event) => setAnswer(question.id, event.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Masukkan jawaban JSON sesuai instruksi soal." />
            )}
          </fieldset>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button type="button" disabled={busy} onClick={submit} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Mengirim..." : secondsLeft === 0 ? "Kirim jawaban (waktu habis)" : "Kirim jawaban"}
        </button>
      </div>
    </section>
  );
}
