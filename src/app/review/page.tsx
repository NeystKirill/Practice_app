"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Grade, Word } from "@/lib/types";

const GRADES: { grade: Grade; label: string; hint: string; cls: string }[] = [
  { grade: 1, label: "Не помню", hint: "снова", cls: "bg-red-500/90" },
  { grade: 3, label: "Трудно", hint: "", cls: "bg-amber-500/90" },
  { grade: 4, label: "Хорошо", hint: "", cls: "bg-emerald-500/90" },
  { grade: 5, label: "Легко", hint: "", cls: "bg-sky-500/90" },
];

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

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  if (!current) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {done > 0 ? "Готово 🎉" : "Пока нечего повторять"}
        </h1>
        <p className="text-sm text-muted">
          {done > 0
            ? `Повторено за сессию: ${done}. Возвращайтесь позже.`
            : "Все слова на сегодня закрыты. Добавьте новые в словаре."}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/words"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-card"
          >
            В словарь
          </Link>
          <button
            onClick={load}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-card"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Осталось: {queue.length}</span>
        <span>Сделано: {done}</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="text-3xl font-semibold">{current.term}</div>

        {revealed ? (
          <div className="mt-4 space-y-1">
            <div className="text-xl">
              {current.translation || (
                <span className="italic text-muted">перевод не задан</span>
              )}
            </div>
            {current.note && (
              <p className="text-sm text-muted">{current.note}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Показать перевод{" "}
            <span className="opacity-70">(Пробел)</span>
          </button>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g, i) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              disabled={busy}
              className={`rounded-lg px-3 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${g.cls}`}
            >
              <span className="block">{g.label}</span>
              <span className="text-[11px] opacity-75">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
