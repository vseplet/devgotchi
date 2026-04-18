import { randomUUID } from "node:crypto";
import type { LogEntry } from "$/tui/Log";
import { BACKEND_URL } from "$/config";
import { clearSession, loadSession, saveSession, type Session } from "$/session";

export interface CommandContext {
  append: (entry: Omit<LogEntry, "ts">) => void;
  exit: () => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  getRoomCode: () => string | null;
}

const HELP_LINES = [
  "/help                — show this help",
  "/login               — authenticate via GitHub",
  "/logout              — clear local session",
  "/whoami              — show the current session",
  "/room <code>         — join or create a room",
  "/leave               — leave the current room",
  "/status <text>       — set your status (empty to clear)",
  "/quit                — exit",
  "any text             — send a message to the current room",
];

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin"
    ? ["open", url]
    : process.platform === "win32"
    ? ["cmd", "/c", "start", "", url]
    : ["xdg-open", url];
  Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" });
}

function authHeaders(): HeadersInit | null {
  const session = loadSession();
  if (!session) return null;
  return { authorization: `Bearer ${session.key}` };
}

async function login(ctx: CommandContext): Promise<void> {
  if (loadSession()) {
    ctx.append({ kind: "info", text: "Already logged in. /logout first to switch accounts." });
    return;
  }

  const loginToken = randomUUID();
  const loginUrl = `${BACKEND_URL}/auth/login?loginToken=${loginToken}`;

  ctx.append({ kind: "system", text: "Opening browser for GitHub login…" });
  ctx.append({ kind: "info", text: `If it doesn't open: ${loginUrl}` });
  openBrowser(loginUrl);

  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${BACKEND_URL}/auth/wait-for-complete?loginToken=${loginToken}`,
    );

    if (res.status === 204) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    if (!res.ok) {
      ctx.append({ kind: "error", text: `Login failed: ${res.status} ${await res.text()}` });
      return;
    }

    const payload = await res.json() as Omit<Session, "created_at">;
    saveSession(payload);
    ctx.append({ kind: "system", text: `✓ Logged in as @${payload.username}` });
    return;
  }

  ctx.append({ kind: "error", text: "Login timed out. Try /login again." });
}

async function whoami(ctx: CommandContext): Promise<void> {
  const headers = authHeaders();
  if (!headers) {
    ctx.append({ kind: "info", text: "Not logged in. /login first." });
    return;
  }

  const res = await fetch(`${BACKEND_URL}/auth/me`, { headers });

  if (res.status === 401) {
    clearSession();
    ctx.append({ kind: "error", text: "Session expired. /login again." });
    return;
  }
  if (!res.ok) {
    ctx.append({ kind: "error", text: `Request failed: ${res.status} ${await res.text()}` });
    return;
  }

  const me = await res.json() as { username: string; email: string };
  ctx.append({ kind: "info", text: `@${me.username} <${me.email}>` });
}

function logout(ctx: CommandContext): void {
  const session = loadSession();
  if (!session) {
    ctx.append({ kind: "info", text: "Not logged in." });
    return;
  }
  if (ctx.getRoomCode()) ctx.leaveRoom();
  clearSession();
  ctx.append({ kind: "system", text: `Logged out @${session.username}` });
}

function room(ctx: CommandContext, args: string[]): void {
  if (!loadSession()) {
    ctx.append({ kind: "error", text: "Log in first: /login" });
    return;
  }
  const code = args[0]?.trim();
  if (!code) {
    ctx.append({ kind: "error", text: "Usage: /room <code>" });
    return;
  }
  if (ctx.getRoomCode()) ctx.leaveRoom();
  ctx.joinRoom(code);
}

function leave(ctx: CommandContext): void {
  const current = ctx.getRoomCode();
  if (!current) {
    ctx.append({ kind: "info", text: "Not in a room." });
    return;
  }
  ctx.leaveRoom();
  ctx.append({ kind: "system", text: `Left ${current}` });
}

async function status(ctx: CommandContext, args: string[]): Promise<void> {
  const code = ctx.getRoomCode();
  if (!code) {
    ctx.append({ kind: "error", text: "Join a room first: /room <code>" });
    return;
  }
  const headers = authHeaders();
  if (!headers) {
    ctx.append({ kind: "error", text: "Not logged in. /login first." });
    return;
  }
  const text = args.join(" ").trim();

  const res = await fetch(`${BACKEND_URL}/rooms/${code}/status`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    ctx.append({ kind: "error", text: `Status update failed: ${res.status}` });
  }
}

export async function sendMessage(ctx: CommandContext, text: string): Promise<void> {
  const code = ctx.getRoomCode();
  if (!code) {
    ctx.append({ kind: "info", text: "Not in a room — use /room <code> to join one" });
    return;
  }
  const headers = authHeaders();
  if (!headers) {
    ctx.append({ kind: "error", text: "Not logged in. /login first." });
    return;
  }

  const res = await fetch(`${BACKEND_URL}/rooms/${code}/message`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    ctx.append({ kind: "error", text: `Message failed: ${res.status}` });
  }
}

export async function handleCommand(raw: string, ctx: CommandContext): Promise<void> {
  const [cmd, ...args] = raw.slice(1).trim().split(/\s+/);

  switch (cmd) {
    case "help":
      for (const line of HELP_LINES) ctx.append({ kind: "info", text: line });
      return;

    case "quit":
    case "exit":
      ctx.exit();
      return;

    case "login":
      await login(ctx);
      return;

    case "logout":
      logout(ctx);
      return;

    case "whoami":
      await whoami(ctx);
      return;

    case "room":
      room(ctx, args);
      return;

    case "leave":
      leave(ctx);
      return;

    case "status":
      await status(ctx, args);
      return;

    default:
      ctx.append({ kind: "error", text: `Unknown command: /${cmd}` });
  }
}
