import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

let dbInstance: Database.Database | null = null

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      streak INTEGER NOT NULL DEFAULT 0,
      last_solve_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_solves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      puzzle_date TEXT NOT NULL,
      time_ms INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, puzzle_date)
    );

    CREATE INDEX IF NOT EXISTS idx_daily_solves_date_time
      ON daily_solves(puzzle_date, time_ms);
  `)
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance

  const dbPath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "crossword.db")
  fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(dbPath), {
    recursive: true,
  })

  dbInstance = new Database(dbPath)
  dbInstance.pragma("journal_mode = WAL")
  dbInstance.pragma("foreign_keys = ON")
  ensureSchema(dbInstance)
  return dbInstance
}
