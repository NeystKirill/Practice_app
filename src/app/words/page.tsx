"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import type { Word, WordKind } from "@/lib/types";

function refreshNav() {
  window.dispatchEvent(new Event("practice:refresh"));
}

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
    const t = setTimeout(
      () => load(search.trim() || undefined),
      search ? 250 : 0,
    );
    return () => clearTimeout(t);
  }, [search, load]);

  const reload = () => load(search.trim() || undefined);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Словарь</h1>
        <p className="text-sm text-muted">
          {words.length}{" "}
          {plural(words.length, ["карточка", "карточки", "карточек"])}
        </p>
      </header>

      <AddCardForm
        onAdded={() => {
          reload();
          refreshNav();
        }}
      />

      <div className="space-y-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по тексту или переводу…"
          className={inputClass}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading && words.length === 0 ? (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-[4.5rem] animate-pulse rounded-xl bg-elevated"
              />
            ))}
          </ul>
        ) : words.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            {search
              ? "Ничего не найдено."
              : "Пока пусто. Добавьте слово или предложение выше."}
          </p>
        ) : (
          <ul className="space-y-2">
            {words.map((w) => (
              <CardRow
                key={w.id}
                word={w}
                onChange={() => {
                  reload();
                  refreshNav();
                }}
              />
            ))}
          </ul>
        )}
      </div>
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
    <div className="inline-flex rounded-lg bg-elevated p-0.5 text-sm">
      {(["word", "phrase"] as const).map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onChange(k)}
          className={`rounded-md px-3 py-1 font-medium transition-colors disabled:opacity-50 ${
            value === k
              ? "bg-card text-foreground shadow-sm"
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
  const [flash, setFlash] = useState(false);

  const isPhrase = kind === "phrase";

  function resetAi() {
    setAiFilled(false);
    setHint(null);
  }

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
          : [r.partOfSpeech, r.transcription].filter(Boolean).join("  ·  ") ||
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
      resetAi();
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      onSubmit={save}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <KindToggle
          value={kind}
          onChange={(k) => {
            setKind(k);
            resetAi();
          }}
          disabled={busy !== null}
        />
        <span
          className={`text-xs font-medium text-success transition-opacity duration-200 ${
            flash ? "opacity-100" : "opacity-0"
          }`}
        >
          Добавлено ✓
        </span>
      </div>

      <div className={isPhrase ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <Field label={isPhrase ? "Предложение на английском" : "Слово"}>
          {isPhrase ? (
            <textarea
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                resetAi();
              }}
              rows={2}
              placeholder="Every cloud has a silver lining."
              className={`${inputClass} resize-y`}
            />
          ) : (
            <input
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                resetAi();
              }}
              placeholder="resilient"
              className={inputClass}
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="Перевод"
          hint={hint ?? (aiFilled ? "предложено ИИ — можно поправить" : undefined)}
        >
          {isPhrase ? (
            <textarea
              value={translation}
              onChange={(e) => {
                setTranslation(e.target.value);
                setAiFilled(false);
              }}
              rows={2}
              placeholder="Нет худа без добра."
              className={`${inputClass} resize-y`}
            />
          ) : (
            <input
              value={translation}
              onChange={(e) => {
                setTranslation(e.target.value);
                setAiFilled(false);
              }}
              placeholder="устойчивый, жизнестойкий"
              className={inputClass}
              autoComplete="off"
            />
          )}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!term.trim() || busy !== null}>
          {busy === "save" ? "Сохранение…" : "Добавить"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={askAi}
          disabled={!term.trim() || busy !== null}
        >
          {busy === "ai" ? "ИИ переводит…" : "Перевести с ИИ"}
        </Button>
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
  const meta = useMemo(() => {
    const iv =
      word.intervalDays < 1
        ? "<1 дн"
        : `${Math.round(word.intervalDays)} дн`;
    return `${word.repetitions} повт · ${iv} · ${formatDue(word.dueAt)}`;
  }, [word]);

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
    <li className="group rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={isPhrase ? "text-sm font-medium" : "font-medium"}
              style={isPhrase ? { whiteSpace: "pre-wrap" } : undefined}
            >
              {word.term}
            </span>
            {isPhrase && (
              <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                фраза
              </span>
            )}
            {word.translationSource === "ai" && (
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                ИИ
              </span>
            )}
          </div>

          {editing ? (
            <div className="flex gap-2 pt-1">
              {isPhrase ? (
                <textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  rows={2}
                  className={`${inputClass} flex-1`}
                />
              ) : (
                <input
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
              )}
              <Button size="sm" onClick={saveEdit} disabled={busy}>
                ОК
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setTranslation(word.translation);
                }}
              >
                Отмена
              </Button>
            </div>
          ) : (
            <p
              className="text-sm text-muted"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {word.translation || (
                <span className="italic">нет перевода</span>
              )}
            </p>
          )}

          <p className="text-xs text-muted/80 tabular-nums">{meta}</p>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <IconBtn label="Изменить" onClick={() => setEditing(true)}>
              ✎
            </IconBtn>
            <IconBtn label="Перевести с ИИ" onClick={aiRetranslate} disabled={busy}>
              ✦
            </IconBtn>
            <IconBtn label="Удалить" onClick={remove} disabled={busy} danger>
              ✕
            </IconBtn>
          </div>
        )}
      </div>
    </li>
  );
}

function IconBtn({
  label,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-elevated disabled:opacity-40 ${
        danger ? "text-danger hover:bg-danger hover:text-white" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function formatDue(dueAt: number): string {
  const diff = dueAt - Date.now();
  if (diff <= 0) return "к повторению";
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
