"use client";

import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { api } from "@/lib/api";
import { applyReview } from "@/lib/srs";
import type { Grade, Word } from "@/lib/types";

const GRADES: { grade: Grade; label: string; cls: string }[] = [
  { grade: 1, label: "Не помню", cls: "bg-danger" },
  { grade: 3, label: "Трудно", cls: "bg-warning" },
  { grade: 4, label: "Хорошо", cls: "bg-accent" },
  { grade: 5, label: "Легко", cls: "bg-success" },
];

function nextInterval(word: Word, grade: Grade): string {
  const out = applyReview(
    {
      repetitions: word.repetitions,
      easeFactor: word.easeFactor,
      intervalDays: word.intervalDays,
    },
    grade,
  );
  if (out.intervalDays === 0) return "10 мин";
  if (out.intervalDays < 1) return "<1 дн";
  return `${Math.round(out.intervalDays)} дн`;
}

export default function ReviewPage() {
  const [queue, setQueue] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { queue } = await api.getQueue(50);
      setQueue(queue);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getQueue(50)
      .then((r) => {
        if (!cancelled) setQueue(r.queue);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = queue[0];

  const grade = useCallback(
    async (g: Grade) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        await api.grade(current.id, g);
        setQueue((q) => q.slice(1));
        setRevealed(false);
        setDone((d) => d + 1);
        setError(null);
        window.dispatchEvent(new Event("practice:refresh"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        setBusy(false);
      }
    },
    [current, busy],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (!revealed && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1].grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, grade]);

  const total = done + queue.length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-1.5 w-full rounded-full bg-elevated" />
        <div className="h-64 w-full animate-pulse rounded-2xl bg-elevated" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">{error}</p>
        <button
          onClick={load}
          className="text-sm text-accent underline underline-offset-2"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-5 py-8 text-center">
        <div className="text-5xl" aria-hidden>
          {done > 0 ? "🎉" : "☕"}
        </div>
        <h1 className="font-serif text-2xl">
          {done > 0 ? "Сессия завершена" : "Пока нечего повторять"}
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted">
          {done > 0
            ? `Повторено карточек: ${done}. Следующие подойдут по расписанию.`
            : "Все карточки на сегодня закрыты. Добавьте новые или зайдите позже."}
        </p>
        <div className="flex justify-center gap-2.5">
          <ButtonLink href="/words" variant="secondary">
            В словарь
          </ButtonLink>
          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-elevated"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  const isPhrase = current.kind === "phrase";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted tabular-nums">
          <span>Осталось: {queue.length}</span>
          <span>Сделано: {done}</span>
        </div>
      </div>

      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
        <div className="flex items-center gap-2">
          {isPhrase && (
            <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
              предложение
            </span>
          )}
        </div>
        <p
          className={`font-serif ${
            isPhrase ? "text-2xl leading-snug" : "text-4xl"
          }`}
          style={{ whiteSpace: "pre-wrap", textWrap: "balance" }}
        >
          {current.term}
        </p>

        {revealed ? (
          <div className="rise space-y-2 border-t border-border pt-5">
            <p
              className={`${isPhrase ? "text-lg" : "text-xl"} text-foreground`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {current.translation || (
                <span className="italic text-muted">перевод не задан</span>
              )}
            </p>
            {current.note && (
              <p className="text-sm text-muted">{current.note}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-contrast transition-[filter] hover:brightness-110"
          >
            Показать перевод
            <kbd className="rounded bg-black/15 px-1.5 py-0.5 text-[11px] font-normal">
              Space
            </kbd>
          </button>
        )}
      </div>

      {revealed && (
        <div className="rise grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g, i) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              disabled={busy}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 ${g.cls}`}
            >
              <span className="text-sm font-medium">{g.label}</span>
              <span className="text-[11px] text-white/80 tabular-nums">
                {nextInterval(current, g.grade)}
              </span>
              <span className="mt-0.5 text-[10px] text-white/55">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
