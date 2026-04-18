import { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export function InputBar({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");

  const handleSubmit = (v: string) => {
    if (!v.trim()) return;
    onSubmit(v);
    setValue("");
  };

  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="cyan">❯ </Text>
      <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
    </Box>
  );
}
