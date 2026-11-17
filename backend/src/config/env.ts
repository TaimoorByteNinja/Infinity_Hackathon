import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
/** Repository root (works from both src/ and dist/). */
export const ROOT_DIR = resolve(here, "../../..");

const envFile = resolve(ROOT_DIR, ".env");
if (existsSync(envFile)) dotenv.config({ path: envFile });

function list(v: string | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** Any OpenAI-compatible provider works; these are the defaults per provider. */
const PROVIDERS = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", fallbacks: "openai/gpt-oss-20b" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "google/gemini-2.5-flash", fallbacks: "openai/gpt-4o-mini" },
} as const;
const provider = (process.env.AI_PROVIDER === "openrouter" ? "openrouter" : "groq") as keyof typeof PROVIDERS;

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET ?? "";
if (isProduction && sessionSecret.length < 16) {
  throw new Error("SESSION_SECRET must be set (16+ characters) in production.");
}

export const env = {
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: sessionSecret || "dev-only-insecure-session-secret",
  ai: {
    provider,
    baseUrl: process.env.AI_BASE_URL || PROVIDERS[provider].baseUrl,
    apiKey: process.env.AI_API_KEY || undefined,
    model: process.env.AI_MODEL || PROVIDERS[provider].model,
    fallbackModels: list(process.env.AI_FALLBACK_MODELS ?? PROVIDERS[provider].fallbacks),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120_000),
  },
  frontendDir: resolve(ROOT_DIR, "frontend"),
} as const;
