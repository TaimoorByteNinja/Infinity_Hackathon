import type { Prisma } from "@prisma/client";
import type { SessionUser } from "../../middleware/auth.js";

/**
 * Single source of truth for row-level access. Every data query uses these filters,
 * so restrictions apply to direct API requests — not only to what the UI shows.
 *
 *   ADMIN   -> all projects / all tasks
 *   MANAGER -> projects where managerId == me; all tasks in those projects
 *   AGENT   -> projects containing a task assigned to me; only my own tasks
 */
export function projectScope(user: SessionUser): Prisma.ProjectWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { managerId: user.id };
    case "AGENT":
      return { tasks: { some: { assigneeId: user.id } } };
  }
}

export function taskScope(user: SessionUser): Prisma.TaskWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { project: { managerId: user.id } };
    case "AGENT":
      return { assigneeId: user.id };
  }
}
