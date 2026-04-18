import { BACKEND_URL } from "$/config";
import { clearSession, loadSession } from "$/session";

export async function whoami(): Promise<void> {
  const session = loadSession();
  if (!session) {
    console.error("Not logged in. Run `devgotchi login` first.");
    process.exit(1);
  }

  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { authorization: `Bearer ${session.key}` },
  });

  if (res.status === 401) {
    clearSession();
    console.error("Session expired. Run `devgotchi login` again.");
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`Request failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const me = await res.json() as { username: string; email: string; avatar_url: string };
  console.log(`@${me.username} <${me.email}>`);
}
