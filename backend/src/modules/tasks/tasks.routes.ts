import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { currentUser } from "../../middleware/auth.js";
import { taskScope } from "../projects/access-policy.js";
import { personSelect, serializeTask } from "../projects/project.serializer.js";

export const tasksRouter = Router();

/** Tasks visible to the current user (agent: My Tasks; manager: their projects; admin: all). */
tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const tasks = await prisma.task.findMany({
      where: taskScope(user),
      include: {
        assignee: { select: personSelect },
        project: { select: { id: true, name: true, clientName: true, manager: { select: personSelect } } },
      },
      orderBy: [{ deadline: "asc" }, { title: "asc" }],
    });
    res.json({ tasks: tasks.map((t) => ({ ...serializeTask(t), project: t.project })) });
  }),
);
