import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { forbidden, notFound } from "../../lib/http-error.js";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { projectScope, taskScope } from "./access-policy.js";
import { personSelect, serializeProject } from "./project.serializer.js";

export const projectsRouter = Router();

/** getProjects(currentUser) */
projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const projects = await prisma.project.findMany({
      where: projectScope(user),
      include: {
        manager: { select: personSelect },
        tasks: { where: taskScope(user), include: { assignee: { select: personSelect } } },
      },
      orderBy: [{ deadline: "asc" }, { name: "asc" }],
    });
    res.json({ projects: projects.map((p) => serializeProject(p, false)) });
  }),
);

/** getProjectById(currentUser, id) — rejects projects outside the user's scope. */
projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const id = String(req.params.id);
    const project = await prisma.project.findFirst({
      where: { AND: [{ id }, projectScope(user)] },
      include: {
        manager: { select: personSelect },
        tasks: { where: taskScope(user), include: { assignee: { select: personSelect } } },
      },
    });
    if (!project) {
      const exists = await prisma.project.count({ where: { id } });
      throw exists ? forbidden("You do not have access to this project.") : notFound("Project not found.");
    }
    res.json({ project: serializeProject(project, true) });
  }),
);

/** Admin-only: delete a project and its tasks (cascade). */
projectsRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const deleted = await prisma.project.deleteMany({ where: { id } });
    if (!deleted.count) throw notFound("Project not found.");
    res.status(204).end();
  }),
);
