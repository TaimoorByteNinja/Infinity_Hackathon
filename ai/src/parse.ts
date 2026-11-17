import type { DraftProject, DraftTask, TranscriptDraft } from "./types.js";

/** Pull the first JSON object out of a model response (handles ```json fences and stray prose). */
export function extractJsonObject(content: string): unknown {
  const text = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("Response contains no JSON object");
    return JSON.parse(text.slice(start, end + 1));
  }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function str(o: Obj, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function hours(o: Obj): number | null {
  for (const k of ["estimatedHours", "hours", "estimate"]) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number.parseFloat(v.replace(/[^0-9.\-]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function date(o: Obj, ...keys: string[]): string {
  const raw = str(o, ...keys);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return m?.[1] ?? raw;
}

function normaliseTask(t: unknown): DraftTask {
  const o = isObj(t) ? t : {};
  return {
    title: str(o, "title", "name"),
    description: str(o, "description", "scope"),
    assigneeId: str(o, "assigneeId", "assignee", "ownerId", "owner"),
    deadline: date(o, "deadline", "dueDate", "due"),
    estimatedHours: hours(o),
  };
}

function normaliseProject(p: unknown): DraftProject {
  const o = isObj(p) ? p : {};
  const tasks = Array.isArray(o.tasks) ? o.tasks : [];
  return {
    name: str(o, "name", "projectName", "title"),
    clientName: str(o, "clientName", "client"),
    description: str(o, "description", "scope"),
    managerId: str(o, "managerId", "manager"),
    deadline: date(o, "deadline", "dueDate"),
    tasks: tasks.map(normaliseTask),
  };
}

/**
 * Coerce raw model JSON into the draft shape WITHOUT judging business validity.
 * Throws only when the top-level structure is unusable.
 */
export function normaliseDraft(raw: unknown): TranscriptDraft {
  if (!isObj(raw) || !Array.isArray(raw.projects)) {
    throw new Error('Expected an object with a "projects" array');
  }
  // Models occasionally pad arrays with empty objects; an entirely empty entry carries no data.
  const projects = raw.projects
    .map(normaliseProject)
    .map((p) => ({ ...p, tasks: p.tasks.filter((t) => t.title || t.assigneeId || t.deadline || t.estimatedHours !== null) }))
    .filter((p) => p.name || p.clientName || p.managerId || p.deadline || p.tasks.length > 0);
  return { projects };
}
