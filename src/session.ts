import { db } from "$/db";

export interface Session {
  key: string;
  gh_id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: number;
}

const insertStmt = db.prepare(`
  INSERT INTO session (id, key, gh_id, username, email, avatar_url, created_at)
  VALUES (1, $key, $gh_id, $username, $email, $avatar_url, $created_at)
  ON CONFLICT(id) DO UPDATE SET
    key = excluded.key,
    gh_id = excluded.gh_id,
    username = excluded.username,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    created_at = excluded.created_at
`);

const selectStmt = db.query<Session, []>("SELECT * FROM session WHERE id = 1");
const deleteStmt = db.prepare("DELETE FROM session WHERE id = 1");

export function saveSession(s: Omit<Session, "created_at">): void {
  insertStmt.run({
    $key: s.key,
    $gh_id: s.gh_id,
    $username: s.username,
    $email: s.email,
    $avatar_url: s.avatar_url,
    $created_at: Date.now(),
  });
}

export function loadSession(): Session | null {
  return selectStmt.get() ?? null;
}

export function clearSession(): void {
  deleteStmt.run();
}
