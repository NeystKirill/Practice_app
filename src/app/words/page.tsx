"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Word, WordKind } from "@/lib/types";

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setWords(await api.listWords(q));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim() || undefined), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Словарь</h1>
        <p className="mt-1 text-sm text-muted">
          {words.length}{" "}
          {plural(words.length, ["карточка", "карточки", "карточек"])}
        </p>
      </div>

      <AddCardForm onAdded={() => load(search.trim() || undefined)} />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по тексту или переводу…"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && words.length === 0 ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <ul className="space-y-2">
          {words.map((w) => (
            <CardRow
              key={w.id}
              word={w}
              onChange={() => load(search.trim() || undefined)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function KindToggle({
  value,
  onChange,
  disabled,
}: {
  value: WordKind;
  onChange: (k: WordKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
      {(["word", "phrase"] as const).map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onChange(k)}
          className={`rounded-md px-3 py-1 transition-colors disabled:opacity-50 ${
            value === k
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {k === "word" ? "Слово" : "Предложение"}
        </button>
      ))}
    </div>
  );
}

function AddCardForm({ onAdded }: { onAdded: () => void }) {
  const [kind, setKind] = useState<WordKind>("word");
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [busy, setBusy] = useState<null | "ai" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const isPhrase = kind === "phrase";

  async function askAi() {
    if (!term.trim()) return;
    setBusy("ai");
    setError(null);
    setHint(null);
    try {
      const r = await api.translate(term.trim(), kind);
      setTranslation(r.translation);
      setAiFilled(true);
      setHint(
        isPhrase
          ? null
          : [r.partOfSpeech, r.transcription].filter(Boolean).join(" · ") ||
              null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка перевода");
    } finally {
      setBusy(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setBusy("save");
    setError(null);
    try {
      await api.createWord({
        term: term.trim(),
        translation: translation.trim(),
        translationSource: aiFilled && translation.trim() ? "ai" : "user",
        kind,
      });
      setTerm("");
      setTranslation("");
      setAiFilled(false);
      setHint(null);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(null);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <form
      onSubmit={save}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <KindToggle
        value={kind}
        onChange={(k) => {
          setKind(k);
          setAiFilled(false);
          setHint(null);
        }}
        disabled={busy !== null}
      />

      <div className={isPhrase ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        {isPhrase ? (
          <textarea
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setAiFilled(false);
            }}
            rows={2}
            placeholder="English sentence"
            className={fieldClass}
          />
        ) : (
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setAiFilled(false);
            }}
            placeholder="English word"
            className={fieldClass}
          />
        )}
        {isPhrase ? (
          <textarea
            value={translation}
            onChange={(e) => {
              setTranslation(e.target.value);
              setAiFilled(false);
            }}
            rows={2}
            placeholder="перевод предложения (свой или от ИИ)"
            className={fieldClass}
          />
        ) : (
          <input
            value={translation}
            onChange={(e) => {
              setTranslation(e.target.value);
              setAiFilled(false);
            }}
            placeholder="перевод (свой или от ИИ)"
            className={fieldClass}
          />
        )}
      </div>

      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!term.trim() || busy !== null}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy === "save" ? "Сохранение…" : "Добавить"}
        </button>
        <button
          type="button"
          onClick={askAi}
          disabled={!term.trim() || busy !== null}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background disabled:opacity-50"
        >
          {busy === "ai"
            ? "ИИ думает…"
            : isPhrase
              ? "Перевести предложение"
              : "Перевод от ИИ"}
        </button>
      </div>
    </form>
  );
}

function CardRow({ word, onChange }: { word: Word; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [translation, setTranslation] = useState(word.translation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPhrase = word.kind === "phrase";
  const due = useMemo(() => formatDue(word.dueAt), [word.dueAt]);

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      await api.updateWord(word.id, {
        translation: translation.trim(),
        translationSource: "user",
      });
      setEditing(false);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function aiRetranslate() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.translate(word.term, word.kind);
      await api.updateWord(word.id, {
        translation: r.translation,
        translationSource: "ai",
      });
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка перевода");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Удалить «${word.term}»?`)) return;
    setBusy(true);
    try {
      await api.deleteWord(word.id);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={
                isPhrase ? "text-sm font-medium" : "font-medium"
              }
              style={isPhrase ? { whiteSpace: "pre-wrap" } : undefined}
            >
              {word.term}
            </span>
            {isPhrase && (
              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                фраза
              </span>
            )}
            {word.translationSource === "ai" && (
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                ИИ
              </span>
            )}
          </div>
          {editing ? (
            <div className="mt-2 flex gap-2">
              {isPhrase ? (
                <textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  rows={2}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                />
              ) : (
                <input
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                />
              )}
              <button
                onClick={saveEdit}
                disabled={busy}
                className="h-fit rounded-md bg-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                ОК
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTranslation(word.translation);
                }}
                className="h-fit rounded-md border border-border px-3 py-1 text-xs"
              >
                Отмена
              </button>
            </div>
          ) : (
            <p
              className="mt-0.5 text-sm text-muted"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {word.translation || <span className="italic">нет перевода</span>}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">
            повтор {word.repetitions} · интервал{" "}
            {word.intervalDays < 1
              ? "<1 дн."
              : `${Math.round(word.intervalDays)} дн.`}{" "}
            · {due}
          </p>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-col gap-1 text-xs">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-border px-2 py-1 hover:bg-background"
            >
              Изменить
            </button>
            <button
              onClick={aiRetranslate}
              disabled={busy}
              className="rounded-md border border-border px-2 py-1 hover:bg-background disabled:opacity-50"
            >
              ИИ
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-md border border-border px-2 py-1 text-red-500 hover:bg-background disabled:opacity-50"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function formatDue(dueAt: number): string {
  const diff = dueAt - Date.now();
  if (diff <= 0) return "готово к повторению";
  const days = Math.round(diff / 86_400_000);
  if (days >= 1) return `через ${days} ${plural(days, ["день", "дня", "дней"])}`;
  const mins = Math.round(diff / 60_000);
  return `через ${mins} мин`;
}

function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
