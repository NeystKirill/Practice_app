export type TranslationSource = "user" | "ai";

export type WordKind = "word" | "phrase";

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface Word {
  id: number;
  term: string;
  translation: string;
  translationSource: TranslationSource;
  kind: WordKind;
  note: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: number;
  createdAt: number;
  updatedAt: number;
  lastReviewedAt: number | null;
}

export interface WordRow {
  id: number;
  term: string;
  translation: string;
  translation_source: TranslationSource;
  kind: WordKind;
  note: string;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  due_at: number;
  created_at: number;
  updated_at: number;
  last_reviewed_at: number | null;
}

export interface TranslationResult {
  translation: string;
  transcription: string | null;
  partOfSpeech: string | null;
}

export interface Stats {
  total: number;
  due: number;
  learned: number;
  fresh: number;
  phrases: number;
  reviewedToday: number;
}
