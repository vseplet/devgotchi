import { createElement } from "react";
import { render } from "ink";
import pkg from "../package.json" with { type: "json" };
import { App } from "$/tui/App";

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`devgotchi v${pkg.version}

Usage: devgotchi

Launches the interactive TUI. Inside, use /help to see available commands.`);
  process.exit(0);
}

render(createElement(App));
