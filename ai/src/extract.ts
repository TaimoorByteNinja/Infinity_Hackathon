import { AiError } from "./errors.js";
import { complete, HttpError, type OutputMode } from "./llm-client.js";
import { extractJsonObject, normaliseDraft } from "./parse.js";
import { buildMessages } from "./prompt.js";
import type { AiConfig, DirectoryEntry, ExtractionResult } from "./types.js";

/**
 * Convert a meeting transcript into a draft of projects + tasks.
 * Tries the primary model, then each fallback model, until one returns usable JSON.
 */
export async function extractProjectsFromTranscript(
  transcript: string,
  directory: DirectoryEntry[],
  config: AiConfig,
  referenceDate: string,
): Promise<ExtractionResult> {
  if (!config.apiKey) {
    throw new AiError("AI_NOT_CONFIGURED", "AI is not configured: set AI_API_KEY in the environment.");
  }
  const messages = buildMessages(transcript, directory, referenceDate);
  const models = [config.model, ...config.fallbackModels].filter((m, i, a) => m && a.indexOf(m) === i);
  const attempts: string[] = [];

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const MAX_WAIT_SEC = 30;

  for (const model of models) {
    let rateLimitRetried = false;
    const modes: OutputMode[] = ["schema", "json", "text"];
    for (let k = 0; k < modes.length; k++) {
      const mode = modes[k]!;
      try {
        const content = await complete({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          model,
          messages,
          mode,
          timeoutMs: config.timeoutMs ?? 120_000,
          appName: config.appName,
          appUrl: config.appUrl,
        });
        const draft = normaliseDraft(extractJsonObject(content));
        // An empty result is treated as a failed attempt so the next mode/model gets a chance.
        if (draft.projects.length === 0) throw new Error("NO_PROJECTS: model returned no projects");
        return { draft, model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        attempts.push(`${model} [${mode}]: ${msg}`);
        if (err instanceof HttpError && err.status === 401) {
          throw new AiError("AI_AUTH_FAILED", "The AI provider rejected the API key (401). Check AI_API_KEY.", attempts);
        }
        // Rate limited with a short wait: wait once, then retry the same model + mode.
        if (err instanceof HttpError && err.status === 429 && !rateLimitRetried && (err.retryAfterSec ?? 99) <= MAX_WAIT_SEC) {
          rateLimitRetried = true;
          await sleep(Math.ceil((err.retryAfterSec ?? 0) * 1000) + 500);
          k--;
          continue;
        }
        // Only downgrade the output mode when the provider rejected the request format.
        if (!(err instanceof HttpError && err.status === 400)) break;
      }
    }
  }

  if (attempts.length > 0 && attempts.every((a) => a.includes("NO_PROJECTS"))) {
    throw new AiError(
      "AI_NO_PROJECTS",
      "The AI could not find any projects in this text. Paste a meeting transcript that discusses client projects, owners, deadlines and estimates. Nothing was saved.",
      attempts,
    );
  }
  const allInvalid = attempts.every((a) => /JSON|projects/.test(a));
  throw new AiError(
    allInvalid ? "AI_INVALID_OUTPUT" : "AI_UNAVAILABLE",
    allInvalid
      ? "The AI returned output that could not be read as projects. Nothing was saved — please try again."
      : "The AI service is unavailable right now (all configured models failed). Nothing was saved — please try again.",
    attempts,
  );
}
