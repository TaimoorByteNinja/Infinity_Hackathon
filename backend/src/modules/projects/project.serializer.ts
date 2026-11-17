import type { Project, Task, User } from "@prisma/client";
import { fromDbDate } from "../../lib/dates.js";

type PersonRef = Pick<User, "id" | "name" | "specialization">;
export const personSelect = { id: true, name: true, specialization: true } as const;

export function serializeTask(t: Task & { assignee: PersonRef; project?: Pick<Project, "id" | "name" | "clientName"> }) {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    assignee: t.assignee,
    deadline: fromDbDate(t.deadline),
    estimatedHours: t.estimatedHours,
    ...(t.project ? { project: t.project } : {}),
  };
}

export function serializeProject(p: Project & { manager: PersonRef; tasks: (Task & { assignee: PersonRef })[] }, includeTasks: boolean) {
  const tasks = [...p.tasks].sort((a, b) => a.deadline.getTime() - b.deadline.getTime() || a.title.localeCompare(b.title));
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    description: p.description,
    deadline: fromDbDate(p.deadline),
    manager: p.manager,
    taskCount: tasks.length,
    totalHours: tasks.reduce((s, t) => s + t.estimatedHours, 0),
    createdAt: p.createdAt.toISOString(),
    ...(includeTasks ? { tasks: tasks.map(serializeTask) } : {}),
  };
}
