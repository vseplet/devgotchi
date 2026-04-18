import { Database } from "bun:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { DATA_DIR, DB_FILE } from "$/config";

mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_FILE);
db.run("PRAGMA journal_mode = WAL");

db.run(`
  CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    key TEXT NOT NULL,
    gh_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at INTEGER NOT NULL
  )
`);

try {
  chmodSync(DB_FILE, 0o600);
} catch {
  // ignore on systems where chmod is a no-op
}
