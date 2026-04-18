import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DATA_DIR = process.env.DEVGOTCHI_DATA_DIR ?? join(homedir(), ".devgotchi");
export const DB_FILE = join(DATA_DIR, "data.db");
export const CONFIG_FILE = join(DATA_DIR, "config.json");

const DEFAULT_BACKEND_URL = "https://devgotchi.vseplet.deno.net";

interface UserConfig {
  backend_url?: string;
}

function readUserConfig(): UserConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as UserConfig;
  } catch {
    return {};
  }
}

const userConfig = readUserConfig();

export const BACKEND_URL = process.env.DEVGOTCHI_BACKEND_URL
  ?? userConfig.backend_url
  ?? DEFAULT_BACKEND_URL;
