"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { startGameAttemptAction, submitGameAttemptAction } from "@/modules/learning/actions";

type PublicGame = { type: string; title: string; introduction?: string; instructions?: string; [key: string]: any };
type Grade = { percentage: number; passed: boolean; expired: boolean; correctCount: number; totalCount: number };

function formatSeconds(value: number) {
  const safe = Math.max(0, value);
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}

export function LearningGameRunner({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    if (!game || game.type !== "TIMED_CHALLENGE" || startedAt === null) {
      setSecondsLeft(null);
      return;
    }
    const update = () => {
      const limitMs = Number(game.timeLimitSeconds) * 1_000;
      setSecondsLeft(Math.max(0, Math.ceil((limitMs - (Date.now() - startedAt)) / 1_000)));
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [game, startedAt]);

  const answer = (id: string, value: unknown) => setAnswers((current) => ({ ...current, [id]: value }));

  const start = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await startGameAttemptAction(gameId);
        setGame(response.game as PublicGame);
        setAttemptId(response.attemptId);
        setStartedAt(new Date(response.startedAt).getTime());
        setAnswers({});
        setRevealedCards({});
        setGrade(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Game tidak dapat dimulai.");
      }
    });
  };

  const submit = () => {
    if (!attemptId) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await submitGameAttemptAction(attemptId, { answers });
        setGrade(response as Grade);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Jawaban tidak dapat dikirim.");
      }
    });
  };

  if (grade) return (
    <div className="mt-3 rounded-md border bg-background p-3">
      <p className="font-semibold">Hasil: {grade.percentage.toFixed(1)}%</p>
      <p className="mt-1 text-xs text-muted-foreground">{grade.correctCount}/{grade.totalCount} benar · {grade.passed ? "Lulus" : "Belum lulus"}{grade.expired ? " · Waktu habis" : ""}</p>
      <button type="button" onClick={() => { setGame(null); setAttemptId(null); setStartedAt(null); setGrade(null); }} className="mt-2 text-xs font-medium text-primary hover:underline">Tutup hasil</button>
    </div>
  );

  if (!game || !attemptId) return (
    <div className="mt-3">
      {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}
      <button type="button" disabled={busy} onClick={start} className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-50">
        {busy ? "Memulai..." : "Mulai game"}
      </button>
    </div>
  );

  const renderInputs = (items: Array<{ id: string; label: string }>): ReactNode => (
    <div className="mt-3 space-y-3">{items.map((item) => (
      <label key={item.id} className="block text-xs">
        <span className="font-medium">{item.label}</span>
        <input value={String(answers[item.id] ?? "")} onChange={(event) => answer(item.id, event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </label>
    ))}</div>
  );

  let content: ReactNode = null;
  if (game.type === "CROSSWORD") {
    content = <div><p className="text-xs text-muted-foreground">Teka-teki silang · Grid {game.rows} × {game.columns}</p>
      {renderInputs((game.entries ?? []).map((entry: any) => ({ id: entry.id, label: entry.number + ". " + entry.clue + " (" + entry.length + " huruf)" })))}
    </div>;
  } else if (game.type === "MULTIPLE_CHOICE" || game.type === "TIMED_CHALLENGE") {
    content = <div className="space-y-4">{(game.questions ?? []).map((question: any, index: number) => (
      <fieldset key={question.id}>
        <legend className="text-sm font-medium">{index + 1}. {question.prompt}</legend>
        <div className="mt-2 space-y-2">{question.options.map((option: any) => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => answer(question.id, option.id)} />
            {option.text}
          </label>
        ))}</div>
      </fieldset>
    ))}</div>;
  } else if (game.type === "TRUE_FALSE") {
    content = <div className="space-y-4">{(game.questions ?? []).map((question: any, index: number) => (
      <fieldset key={question.id}>
        <legend className="text-sm font-medium">{index + 1}. {question.statement}</legend>
        <div className="mt-2 flex gap-4">{[{ value: true, label: "Benar" }, { value: false, label: "Salah" }].map((option) => (
          <label key={String(option.value)} className="flex items-center gap-2 text-sm">
            <input type="radio" name={question.id} checked={answers[question.id] === option.value} onChange={() => answer(question.id, option.value)} />
            {option.label}
          </label>
        ))}</div>
      </fieldset>
    ))}</div>;
  } else if (game.type === "MATCHING_PAIRS") {
    content = <div className="space-y-3">{(game.leftItems ?? []).map((item: any) => (
      <label key={item.id} className="block text-xs">
        <span className="font-medium">{item.text}</span>
        <select value={String(answers[item.id] ?? "")} onChange={(event) => answer(item.id, event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Pilih pasangan</option>
          {(game.rightItems ?? []).map((right: any) => <option key={right.id} value={right.text}>{right.text}</option>)}
        </select>
      </label>
    ))}</div>;
  } else if (game.type === "WORD_SCRAMBLE") {
    content = <div className="space-y-3">{(game.words ?? []).map((item: any) => (
      <div key={item.id}>
        <p className="text-xs">{item.clue}</p>
        <p className="my-1 font-mono text-sm tracking-widest">{item.letters.join(" ")}</p>
        <input value={String(answers[item.id] ?? "")} onChange={(event) => answer(item.id, event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Susun kata..." />
      </div>
    ))}</div>;
  } else if (game.type === "FILL_IN_THE_BLANK") {
    content = <div className="space-y-3">{(game.prompts ?? []).map((item: any) => (
      <label key={item.id} className="block text-xs">
        <span>{item.sentence}</span>
        <input value={String(answers[item.id] ?? "")} onChange={(event) => answer(item.id, event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </label>
    ))}</div>;
  } else if (game.type === "FLASHCARDS") {
    content = <div className="space-y-3">{(game.cards ?? []).map((card: any) => (
      <div key={card.id} className="rounded-md border p-3">
        <p className="font-medium">{revealedCards[card.id] ? card.back : card.front}</p>
        {card.hint && !revealedCards[card.id] && <p className="mt-1 text-xs text-muted-foreground">Petunjuk: {card.hint}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setRevealedCards((current) => ({ ...current, [card.id]: !current[card.id] }))} className="rounded-md border px-3 py-1.5 text-xs">
            {revealedCards[card.id] ? "Lihat sisi depan" : "Balik kartu"}
          </button>
          <button type="button" onClick={() => answer(card.id, "KNOWN")} className={"rounded-md border px-3 py-1.5 text-xs " + (answers[card.id] === "KNOWN" ? "bg-primary text-primary-foreground" : "")}>Sudah dikuasai</button>
          <button type="button" onClick={() => answer(card.id, "REVIEW")} className={"rounded-md border px-3 py-1.5 text-xs " + (answers[card.id] === "REVIEW" ? "bg-primary text-primary-foreground" : "")}>Perlu diulang</button>
        </div>
      </div>
    ))}</div>;
  } else if (game.type === "ORDERING") {
    content = <div>
      <ol className="list-inside list-decimal space-y-1 text-sm">{(game.items ?? []).map((item: any) => <li key={item.id}>{item.text}</li>)}</ol>
      <label className="mt-3 block text-xs">Urutan ID (pisahkan dengan koma)
        <input value={Array.isArray(answers.order) ? (answers.order as string[]).join(", ") : ""} onChange={(event) => answer("order", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="id-langkah-1, id-langkah-2, ..." />
      </label>
    </div>;
  }

  return (
    <div className="mt-3 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{game.type.replaceAll("_", " ")}</p>
        {game.type === "TIMED_CHALLENGE" && <span className={"font-mono text-sm font-bold " + (secondsLeft === 0 ? "text-red-600" : "text-primary")}>{formatSeconds(secondsLeft ?? Number(game.timeLimitSeconds))}</span>}
      </div>
      <h5 className="mt-1 font-semibold">{game.title}</h5>
      {game.introduction && <p className="mt-1 text-xs text-muted-foreground">{game.introduction}</p>}
      {game.instructions && <p className="mt-2 text-xs">{game.instructions}</p>}
      <div className="mt-3">{content}</div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      <button type="button" onClick={submit} disabled={busy} className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? "Mengirim..." : secondsLeft === 0 && game.type === "TIMED_CHALLENGE" ? "Kirim hasil (waktu habis)" : "Kirim hasil game"}
      </button>
    </div>
  );
}
