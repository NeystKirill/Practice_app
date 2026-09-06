export type TranslationSource = "user" | "ai";

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface Word {
  id: number;
  term: string;
  translation: string;
  translationSource: TranslationSource;
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
  reviewedToday: number;
}
