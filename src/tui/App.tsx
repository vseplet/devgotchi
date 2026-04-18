import { useEffect, useRef, useState } from "react";
import { Box, Text, useApp } from "ink";
import { Log, type LogEntry } from "$/tui/Log";
import { InputBar } from "$/tui/InputBar";
import { handleCommand, sendMessage } from "$/tui/commands";
import { formatEvent, type RoomEvent, type RoomMember } from "$/tui/events";
import { BACKEND_URL } from "$/config";
import { loadSession } from "$/session";

const POLL_INTERVAL_MS = 2000;

export function App() {
  const { exit } = useApp();
  const [entries, setEntries] = useState<LogEntry[]>([
    { kind: "system", text: "devgotchi — type /help for commands", ts: Date.now() },
  ]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);

  const roomCodeRef = useRef<string | null>(null);
  const seenEventIds = useRef<Set<string>>(new Set());
  const prevMembers = useRef<Map<number, RoomMember>>(new Map());

  roomCodeRef.current = roomCode;

  const append = (entry: Omit<LogEntry, "ts">) => {
    setEntries((prev) => [...prev, { ...entry, ts: Date.now() }]);
  };

  useEffect(() => {
    if (!roomCode) {
      setMembers([]);
      seenEventIds.current.clear();
      prevMembers.current.clear();
      return;
    }

    const session = loadSession();
    if (!session) {
      append({ kind: "error", text: "Not logged in. /login first." });
      setRoomCode(null);
      return;
    }

    const headers = { authorization: `Bearer ${session.key}` };
    let alive = true;

    const applyState = (state: { members: RoomMember[]; events: RoomEvent[] }) => {
      for (const ev of state.events) {
        if (seenEventIds.current.has(ev.id)) continue;
        seenEventIds.current.add(ev.id);
        append(formatEvent(ev));
      }

      const currentIds = new Set(state.members.map((m) => m.gh_id));
      for (const [gh_id, m] of prevMembers.current) {
        if (!currentIds.has(gh_id)) {
          append({ kind: "info", text: `@${m.username} went quiet` });
        }
      }
      prevMembers.current = new Map(state.members.map((m) => [m.gh_id, m]));
      setMembers(state.members);
    };

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/rooms/${roomCode}/join`, {
          method: "POST",
          headers,
        });
        if (!res.ok) {
          append({ kind: "error", text: `Failed to join: ${res.status} ${await res.text()}` });
          setRoomCode(null);
          return;
        }
        append({ kind: "system", text: `Joined room ${roomCode}` });
        applyState(await res.json());

        while (alive) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (!alive) break;
          try {
            const tick = await fetch(`${BACKEND_URL}/rooms/${roomCode}/state`, { headers });
            if (!tick.ok) continue;
            applyState(await tick.json());
          } catch {
            // transient; try again next tick
          }
        }
      } catch (err) {
        append({ kind: "error", text: `Room error: ${String(err)}` });
        setRoomCode(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [roomCode]);

  const ctx = {
    append,
    exit,
    joinRoom: setRoomCode,
    leaveRoom: () => setRoomCode(null),
    getRoomCode: () => roomCodeRef.current,
  };

  const onSubmit = (value: string) => {
    if (value.startsWith("/")) {
      append({ kind: "user", text: value });
      void handleCommand(value, ctx);
    } else {
      void sendMessage(ctx, value);
    }
  };

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text color="cyan" bold>devgotchi</Text>
        {roomCode && (
          <Text color="gray">
            {" — "}
            {roomCode} · {members.length} online
          </Text>
        )}
      </Box>
      <Box flexDirection="column" paddingX={1}>
        <Log entries={entries} />
      </Box>
      <InputBar onSubmit={onSubmit} />
    </Box>
  );
}
