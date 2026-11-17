import { PROJECTS_JSON_SCHEMA } from "./output-schema.js";
import type { ChatMessage } from "./prompt.js";

/** schema = strict JSON schema, json = JSON object mode, text = no response_format */
export type OutputMode = "schema" | "json" | "text";


export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Seconds the provider asked us to wait before retrying (rate limits). */
    public readonly retryAfterSec?: number,
  ) {
    super(message);
  }
}

function parseRetryAfter(res: Response, message: string): number | undefined {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header;
  const m = /try again in ([\d.]+)s/i.exec(message);
  return m ? Number(m[1]) : undefined;
}

interface CompletionOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  mode: OutputMode;
  timeoutMs: number;
  appName?: string;
  appUrl?: string;
}

/** One chat-completion call to any OpenAI-compatible API (Groq, OpenRouter, ...). Returns the assistant message text. */
export async function complete(opts: CompletionOptions): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        ...(opts.appUrl ? { "HTTP-Referer": opts.appUrl } : {}),
        ...(opts.appName ? { "X-Title": opts.appName } : {}),
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: 0,
        max_tokens: 4096,
        ...(opts.mode === "schema" ? { response_format: { type: "json_schema", json_schema: PROJECTS_JSON_SCHEMA } } : {}),
        ...(opts.mode === "json" ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const body = (await res.json().catch(() => null)) as
      | { choices?: { message?: { content?: string | null } }[]; error?: { message?: string; code?: number } }
      | null;
    if (!res.ok || body?.error) {
      const status = res.ok ? (body?.error?.code ?? 502) : res.status;
      const message = body?.error?.message ?? `HTTP ${res.status}`;
      throw new HttpError(status, message, status === 429 ? parseRetryAfter(res, message) : undefined);
    }
    const content = body?.choices?.[0]?.message?.content;
    if (!content) throw new HttpError(502, "Empty response from model");
    return content;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if ((err as Error).name === "AbortError") throw new HttpError(408, `Timed out after ${opts.timeoutMs} ms`);
    throw new HttpError(503, `Network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
