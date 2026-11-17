import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role, User } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { forbidden, unauthorized } from "../lib/http-error.js";

export const SESSION_COOKIE = "nw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "specialization" | "skills">;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function issueSession(res: Response, userId: string): void {
  const token = jwt.sign({ sub: userId }, env.sessionSecret, { expiresIn: SESSION_TTL_SECONDS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

/**
 * Resolve the current user from the signed session cookie ONLY.
 * Role/user id are never taken from the request body or query.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) throw unauthorized();
    let payload: jwt.JwtPayload | string;
    try {
      payload = jwt.verify(token, env.sessionSecret);
    } catch {
      throw unauthorized("Your session has expired. Please log in again.");
    }
    const userId = typeof payload === "object" ? payload.sub : undefined;
    if (!userId) throw unauthorized();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, specialization: true, skills: true },
    });
    if (!user) throw unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden("This action is restricted to: " + roles.join(", ") + "."));
    next();
  };

export function currentUser(req: Request): SessionUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
