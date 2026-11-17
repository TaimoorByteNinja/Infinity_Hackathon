import { randomUUID } from "node:crypto";
import { extractProjectsFromTranscript, type DirectoryEntry, type TranscriptDraft } from "@novaworks/ai";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { toDbDate, todayInKarachi } from "../../lib/dates.js";
import { HttpError } from "../../lib/http-error.js";
import { validateDraft, type ValidationIssue } from "./draft-validator.js";

export type TranscriptOutcome =
  | { status: "created"; model?: string; projects: { id: string; name: string; clientName: string; taskCount: number; totalHours: number }[] }
  | { status: "needs_correction"; model?: string; draft: TranscriptDraft; issues: ValidationIssue[] };

/** Directory sent to the AI: id, name, role, specialization, skills — never emails or passwords. */
async function loadDirectory(): Promise<DirectoryEntry[]> {
  return prisma.user.findMany({
    select: { id: true, name: true, role: true, specialization: true, skills: true },
    orderBy: { id: "asc" },
  });
}

/** Guard against double submission while a request is still processing. */
const inFlight = new Set<string>();
async function exclusive<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(userId)) throw new HttpError(409, "A transcript is already being processed. Please wait.", "IN_PROGRESS");
  inFlight.add(userId);
  try {
    return await fn();
  } finally {
    inFlight.delete(userId);
  }
}

/** Validate, then save every project + task in ONE transaction (all-or-nothing). */
async function validateAndSave(input: TranscriptDraft, replaceExisting: boolean, model?: string): Promise<TranscriptOutcome> {
  const directory = await loadDirectory();
  const existing = await prisma.project.findMany({ select: { name: true } });
  const { draft, issues } = validateDraft(input, directory, existing.map((p) => p.name), replaceExisting);
  if (issues.length) return { status: "needs_correction", model, draft, issues };

  // The application generates the ids, so the whole draft is written in a constant
  // number of queries (important for remote databases such as Supabase, ~250 ms per round trip).
  const projectRows = draft.projects.map((p) => ({
    id: randomUUID(),
    name: p.name,
    clientName: p.clientName,
    description: p.description,
    managerId: p.managerId,
    deadline: toDbDate(p.deadline),
  }));
  const taskRows = draft.projects.flatMap((p, i) =>
    p.tasks.map((t) => ({
      id: randomUUID(),
      projectId: projectRows[i]!.id,
      title: t.title,
      description: t.description,
      assigneeId: t.assigneeId,
      deadline: toDbDate(t.deadline),
      estimatedHours: t.estimatedHours as number,
    })),
  );

  // All-or-nothing: if any statement fails, nothing is saved.
  await prisma.$transaction([
      ...(replaceExisting
        ? [prisma.project.deleteMany({ where: { OR: draft.projects.map((p) => ({ name: { equals: p.name, mode: "insensitive" as const } })) } })]
        : []),
      prisma.project.createMany({ data: projectRows }),
      prisma.task.createMany({ data: taskRows }),
  ]);

  const created = draft.projects.map((p, i) => ({
    id: projectRows[i]!.id,
    name: p.name,
    clientName: p.clientName,
    taskCount: p.tasks.length,
    totalHours: p.tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0),
  }));
  return { status: "created", model, projects: created };
}

export function createFromTranscript(userId: string, transcript: string, replaceExisting: boolean): Promise<TranscriptOutcome> {
  return exclusive(userId, async () => {
    const directory = await loadDirectory();
    const { draft, model } = await extractProjectsFromTranscript(transcript, directory, env.ai, todayInKarachi());
    return validateAndSave(draft, replaceExisting, model);
  });
}

export function confirmCorrectedDraft(userId: string, draft: TranscriptDraft, replaceExisting: boolean): Promise<TranscriptOutcome> {
  return exclusive(userId, () => validateAndSave(draft, replaceExisting));
}
