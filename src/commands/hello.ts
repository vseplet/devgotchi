const palette = ["\x1b[91m", "\x1b[93m", "\x1b[92m", "\x1b[96m", "\x1b[94m", "\x1b[95m"];
const reset = "\x1b[0m";

export function hello(): void {
  const text = "hello, brew!";
  const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

  if (useColor) {
    const out = [...text].map((ch, i) => palette[i % palette.length] + ch).join("") + reset;
    console.log(out);
  } else {
    console.log(text);
  }
}
