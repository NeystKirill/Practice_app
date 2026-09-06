import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(DATA_DIR, "practice.db");

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  instance = db;
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      term               TEXT    NOT NULL,
      translation        TEXT    NOT NULL DEFAULT '',
      translation_source TEXT    NOT NULL DEFAULT 'user',
      note               TEXT    NOT NULL DEFAULT '',
      repetitions        INTEGER NOT NULL DEFAULT 0,
      ease_factor        REAL    NOT NULL DEFAULT 2.5,
      interval_days      REAL    NOT NULL DEFAULT 0,
      due_at             INTEGER NOT NULL,
      created_at         INTEGER NOT NULL,
      updated_at         INTEGER NOT NULL,
      last_reviewed_at   INTEGER
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_words_term
      ON words (term COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_words_due ON words (due_at);

    CREATE TABLE IF NOT EXISTS reviews (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id       INTEGER NOT NULL REFERENCES words (id) ON DELETE CASCADE,
      grade         INTEGER NOT NULL,
      reviewed_at   INTEGER NOT NULL,
      interval_days REAL    NOT NULL,
      ease_factor   REAL    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_word ON reviews (word_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_at   ON reviews (reviewed_at);
  `);
}
