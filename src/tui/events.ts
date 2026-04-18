import type { LogEntry, LogKind } from "$/tui/Log";

export type EventKind = "join" | "status" | "message";

export interface RoomMember {
  gh_id: number;
  username: string;
  avatar_url: string;
  status: string;
  status_updated_at: number;
  last_seen_at: number;
}

export interface RoomEvent {
  id: string;
  ts: number;
  kind: EventKind;
  actor_gh_id: number;
  actor_username: string;
  text?: string;
}

const KIND_TO_LOG: Record<EventKind, LogKind> = {
  join: "info",
  status: "system",
  message: "user",
};

export function formatEvent(e: RoomEvent): Omit<LogEntry, "ts"> {
  const kind = KIND_TO_LOG[e.kind];
  const who = `@${e.actor_username}`;
  switch (e.kind) {
    case "join":
      return { kind, text: `${who} joined` };
    case "status":
      return { kind, text: e.text ? `${who} is “${e.text}”` : `${who} cleared status` };
    case "message":
      return { kind, text: `${who} › ${e.text ?? ""}` };
  }
}
