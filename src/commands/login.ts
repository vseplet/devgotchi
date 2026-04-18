import { randomUUID } from "node:crypto";
import { BACKEND_URL } from "$/config";
import { saveSession } from "$/session";

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin"
    ? ["open", url]
    : process.platform === "win32"
    ? ["cmd", "/c", "start", "", url]
    : ["xdg-open", url];
  Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" });
}

export async function login(): Promise<void> {
  const loginToken = randomUUID();
  const loginUrl = `${BACKEND_URL}/auth/login?loginToken=${loginToken}`;

  console.log("Opening browser for GitHub login…");
  console.log(`If it doesn't open, visit:\n  ${loginUrl}\n`);
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
      console.error(`Login failed: ${res.status} ${await res.text()}`);
      process.exit(1);
    }

    const payload = await res.json() as {
      key: string;
      gh_id: number;
      username: string;
      email: string | null;
      avatar_url: string | null;
    };

    saveSession(payload);
    console.log(`✓ Logged in as @${payload.username}`);
    return;
  }

  console.error("Login timed out. Try again.");
  process.exit(1);
}
