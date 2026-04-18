import { Box, Text } from "ink";

export type LogKind = "user" | "info" | "error" | "system";

export interface LogEntry {
  kind: LogKind;
  text: string;
  ts: number;
}

const colors: Record<LogKind, string> = {
  user: "white",
  info: "gray",
  error: "red",
  system: "cyan",
};

const prefixes: Record<LogKind, string> = {
  user: "› ",
  info: "· ",
  error: "✗ ",
  system: "» ",
};

export function Log({ entries }: { entries: LogEntry[] }) {
  return (
    <Box flexDirection="column">
      {entries.map((e, i) => (
        <Text key={i} color={colors[e.kind]}>
          {prefixes[e.kind]}
          {e.text}
        </Text>
      ))}
    </Box>
  );
}
