import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../lib/async-handler.js";

export const usersRouter = Router();

const ROLE_ORDER = { ADMIN: 0, MANAGER: 1, AGENT: 2 } as const;

/** Read-only team directory. Never exposes password hashes. */
usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, specialization: true, skills: true },
    });
    users.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.id.localeCompare(b.id));
    res.json({ users });
  }),
);
