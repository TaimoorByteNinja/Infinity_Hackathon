import type { DirectoryEntry, TranscriptDraft } from "@novaworks/ai";
import { isValidIsoDate } from "../../lib/dates.js";

export interface ValidationIssue {
  /** Dot path into the draft, e.g. "projects.0.tasks.2.assigneeId" */
  path: string;
  message: string;
}

export interface ValidationResult {
  draft: TranscriptDraft;
  issues: ValidationIssue[];
}

/**
 * Map an AI reference to a directory id. Accepts the exact id (case-insensitive) or an
 * unambiguous full/first name of someone with the required role. Never invents a person.
 */
export function resolvePerson(ref: string, directory: DirectoryEntry[], role: "MANAGER" | "AGENT"): string {
  const r = ref.trim().toLowerCase();
  if (!r) return "";
  const byId = directory.find((p) => p.id.toLowerCase() === r);
  if (byId) return byId.id;
  const candidates = directory.filter((p) => p.role === role);
  const full = candidates.filter((p) => p.name.toLowerCase() === r);
  if (full.length === 1) return full[0]!.id;
  const first = candidates.filter((p) => p.name.split(" ")[0]!.toLowerCase() === r);
  if (first.length === 1) return first[0]!.id;
  return ref.trim();
}

/**
 * Validate a complete draft before anything is saved (spec §6 createFromTranscript).
 * Returns a resolved copy of the draft plus every unresolved field.
 */
export function validateDraft(
  input: TranscriptDraft,
  directory: DirectoryEntry[],
  existingProjectNames: string[] = [],
  replaceExisting = false,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  const byId = new Map(directory.map((p) => [p.id, p]));
  const existing = new Set(existingProjectNames.map((n) => n.trim().toLowerCase()));
  const seen = new Set<string>();

  const draft: TranscriptDraft = {
    projects: input.projects.map((p) => ({
      ...p,
      name: p.name.trim(),
      clientName: p.clientName.trim(),
      description: p.description.trim(),
      managerId: resolvePerson(p.managerId, directory, "MANAGER"),
      deadline: p.deadline.trim(),
      tasks: p.tasks.map((t) => ({
        ...t,
        title: t.title.trim(),
        description: t.description.trim(),
        assigneeId: resolvePerson(t.assigneeId, directory, "AGENT"),
        deadline: t.deadline.trim(),
      })),
    })),
  };

  if (draft.projects.length === 0) add("projects", "No projects were identified in the transcript.");

  draft.projects.forEach((p, i) => {
    const pp = `projects.${i}`;
    const key = p.name.toLowerCase();
    if (!p.name) add(`${pp}.name`, "Project name is required.");
    else if (seen.has(key)) add(`${pp}.name`, `Duplicate project name "${p.name}" in this draft.`);
    else if (existing.has(key) && !replaceExisting)
      add(`${pp}.name`, `A project named "${p.name}" already exists. Rename it, or enable "Replace existing projects with the same name".`);
    seen.add(key);

    if (!p.clientName) add(`${pp}.clientName`, "Client name is required.");

    const manager = byId.get(p.managerId);
    if (!p.managerId) add(`${pp}.managerId`, "Project manager could not be identified.");
    else if (!manager) add(`${pp}.managerId`, `"${p.managerId}" is not a person in the team directory.`);
    else if (manager.role !== "MANAGER") add(`${pp}.managerId`, `${manager.name} is not a manager.`);

    const projectDateOk = isValidIsoDate(p.deadline);
    if (!projectDateOk) add(`${pp}.deadline`, p.deadline ? `"${p.deadline}" is not a valid date (YYYY-MM-DD).` : "Project deadline is required.");

    if (p.tasks.length === 0) add(`${pp}.tasks`, "Project has no tasks.");

    p.tasks.forEach((t, j) => {
      const tp = `${pp}.tasks.${j}`;
      if (!t.title) add(`${tp}.title`, "Task title is required.");

      const agent = byId.get(t.assigneeId);
      if (!t.assigneeId) add(`${tp}.assigneeId`, "Assigned agent could not be identified.");
      else if (!agent) add(`${tp}.assigneeId`, `"${t.assigneeId}" is not a person in the team directory.`);
      else if (agent.role !== "AGENT") add(`${tp}.assigneeId`, `${agent.name} is not a developer agent.`);

      if (t.estimatedHours === null || !Number.isFinite(t.estimatedHours) || t.estimatedHours <= 0)
        add(`${tp}.estimatedHours`, "Estimated hours must be a positive number.");

      if (!isValidIsoDate(t.deadline))
        add(`${tp}.deadline`, t.deadline ? `"${t.deadline}" is not a valid date (YYYY-MM-DD).` : "Task deadline is required.");
      else if (projectDateOk && t.deadline > p.deadline)
        add(`${tp}.deadline`, `Task deadline ${t.deadline} is after the project deadline ${p.deadline}.`);
    });
  });

  return { draft, issues };
}
