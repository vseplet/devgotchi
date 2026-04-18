import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { hello } from "$/commands/hello";
import { login } from "$/commands/login";
import { whoami } from "$/commands/whoami";

const helloCmd = defineCommand({
  meta: { name: "hello", description: "Print a colorful greeting" },
  run: () => hello(),
});

const loginCmd = defineCommand({
  meta: { name: "login", description: "Authenticate via GitHub" },
  run: () => login(),
});

const whoamiCmd = defineCommand({
  meta: { name: "whoami", description: "Show the current session" },
  run: () => whoami(),
});

const main = defineCommand({
  meta: {
    name: "devgotchi",
    version: pkg.version,
    description: "Collaborative dev tamagotchi",
  },
  subCommands: {
    hello: helloCmd,
    login: loginCmd,
    whoami: whoamiCmd,
  },
});

if (process.argv.length === 2) {
  hello();
} else {
  runMain(main);
}
