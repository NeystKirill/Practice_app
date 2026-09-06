import type { Stats, TranslationResult, Word, WordKind } from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Ошибка ${res.status}`);
  }
  return data as T;
}

export const api = {
  listWords: (q?: string) =>
    req<{ words: Word[] }>(
      `/api/words${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ).then((r) => r.words),

  createWord: (body: {
    term: string;
    translation?: string;
    translationSource?: "user" | "ai";
    kind?: WordKind;
    note?: string;
  }) => req<{ word: Word }>("/api/words", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.word),

  updateWord: (
    id: number,
    body: Partial<{
      term: string;
      translation: string;
      translationSource: "user" | "ai";
      kind: WordKind;
      note: string;
    }>,
  ) =>
    req<{ word: Word }>(`/api/words/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((r) => r.word),

  deleteWord: (id: number) =>
    req<{ ok: true }>(`/api/words/${id}`, { method: "DELETE" }),

  translate: (term: string, kind: WordKind = "word") =>
    req<TranslationResult>("/api/translate", {
      method: "POST",
      body: JSON.stringify({ term, kind }),
    }),

  getQueue: (limit = 30) =>
    req<{ queue: Word[]; stats: Stats }>(`/api/review?limit=${limit}`),

  grade: (wordId: number, grade: number) =>
    req<{ word: Word; stats: Stats }>("/api/review", {
      method: "POST",
      body: JSON.stringify({ wordId, grade }),
    }),
};
