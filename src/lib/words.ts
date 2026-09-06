import "server-only";
import { getDb } from "./db";
import { applyReview, initialSrsState, isLearned } from "./srs";
import type { Grade, Stats, Word, WordRow } from "./types";
import type { CreateWordInput, UpdateWordInput } from "./validation";

function toWord(row: WordRow): Word {
  return {
    id: row.id,
    term: row.term,
    translation: row.translation,
    translationSource: row.translation_source,
    note: row.note,
    repetitions: row.repetitions,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastReviewedAt: row.last_reviewed_at,
  };
}

const startOfToday = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export class DuplicateTermError extends Error {
  constructor(term: string) {
    super(`Слово «${term}» уже есть в словаре`);
    this.name = "DuplicateTermError";
  }
}

export function listWords(search?: string): Word[] {
  const db = getDb();
  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    return db
      .prepare(
        `SELECT * FROM words
         WHERE term LIKE ? COLLATE NOCASE OR translation LIKE ? COLLATE NOCASE
         ORDER BY created_at DESC`,
      )
      .all(like, like)
      .map((r) => toWord(r as WordRow));
  }
  return db
    .prepare(`SELECT * FROM words ORDER BY created_at DESC`)
    .all()
    .map((r) => toWord(r as WordRow));
}

export function getWord(id: number): Word | null {
  const row = getDb().prepare(`SELECT * FROM words WHERE id = ?`).get(id);
  return row ? toWord(row as WordRow) : null;
}

export function createWord(input: CreateWordInput): Word {
  const db = getDb();
  const now = Date.now();
  const srs = initialSrsState();
  try {
    const info = db
      .prepare(
        `INSERT INTO words
           (term, translation, translation_source, note,
            repetitions, ease_factor, interval_days, due_at, created_at, updated_at)
         VALUES (@term, @translation, @translationSource, @note,
                 @repetitions, @easeFactor, @intervalDays, @dueAt, @now, @now)`,
      )
      .run({
        term: input.term,
        translation: input.translation,
        translationSource: input.translationSource,
        note: input.note,
        repetitions: srs.repetitions,
        easeFactor: srs.easeFactor,
        intervalDays: srs.intervalDays,
        dueAt: now,
        now,
      });
    return getWord(Number(info.lastInsertRowid))!;
  } catch (err) {
    if (err instanceof Error && /UNIQUE constraint failed/.test(err.message)) {
      throw new DuplicateTermError(input.term);
    }
    throw err;
  }
}

export function updateWord(id: number, patch: UpdateWordInput): Word | null {
  const existing = getWord(id);
  if (!existing) return null;

  const merged = {
    term: patch.term ?? existing.term,
    translation: patch.translation ?? existing.translation,
    translationSource: patch.translationSource ?? existing.translationSource,
    note: patch.note ?? existing.note,
    updatedAt: Date.now(),
    id,
  };

  try {
    getDb()
      .prepare(
        `UPDATE words SET
           term = @term,
           translation = @translation,
           translation_source = @translationSource,
           note = @note,
           updated_at = @updatedAt
         WHERE id = @id`,
      )
      .run(merged);
  } catch (err) {
    if (err instanceof Error && /UNIQUE constraint failed/.test(err.message)) {
      throw new DuplicateTermError(merged.term);
    }
    throw err;
  }
  return getWord(id);
}

export function deleteWord(id: number): boolean {
  const info = getDb().prepare(`DELETE FROM words WHERE id = ?`).run(id);
  return info.changes > 0;
}

export function dueQueue(limit = 30, now: number = Date.now()): Word[] {
  return getDb()
    .prepare(
      `SELECT * FROM words WHERE due_at <= ? ORDER BY due_at ASC LIMIT ?`,
    )
    .all(now, limit)
    .map((r) => toWord(r as WordRow));
}

export function gradeWord(id: number, grade: Grade): Word | null {
  const db = getDb();
  const word = getWord(id);
  if (!word) return null;

  const now = Date.now();
  const outcome = applyReview(
    {
      repetitions: word.repetitions,
      easeFactor: word.easeFactor,
      intervalDays: word.intervalDays,
    },
    grade,
    now,
  );

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE words SET
         repetitions = @repetitions,
         ease_factor = @easeFactor,
         interval_days = @intervalDays,
         due_at = @dueAt,
         last_reviewed_at = @now,
         updated_at = @now
       WHERE id = @id`,
    ).run({ ...outcome, now, id });

    db.prepare(
      `INSERT INTO reviews (word_id, grade, reviewed_at, interval_days, ease_factor)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, grade, now, outcome.intervalDays, outcome.easeFactor);
  });
  tx();

  return getWord(id);
}

export function stats(): Stats {
  const db = getDb();
  const now = Date.now();

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM words`).get() as { n: number }
  ).n;
  const due = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM words WHERE due_at <= ?`)
      .get(now) as { n: number }
  ).n;
  const fresh = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM words WHERE repetitions = 0`)
      .get() as { n: number }
  ).n;
  const rows = db
    .prepare(`SELECT interval_days FROM words`)
    .all() as { interval_days: number }[];
  const learned = rows.filter((r) => isLearned(r.interval_days)).length;
  const reviewedToday = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM reviews WHERE reviewed_at >= ?`)
      .get(startOfToday()) as { n: number }
  ).n;

  return { total, due, learned, fresh, reviewedToday };
}
