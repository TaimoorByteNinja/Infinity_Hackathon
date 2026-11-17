import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";
import { transcriptsRouter } from "./modules/transcripts/transcripts.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { notFound } from "./lib/http-error.js";

/** Builds the API application. The frontend is attached separately in server.ts. */
export function createApiApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ ok: true }));
  api.use("/auth", authRouter);
  api.use("/users", requireAuth, usersRouter);
  api.use("/projects", requireAuth, projectsRouter);
  api.use("/tasks", requireAuth, tasksRouter);
  api.use("/transcripts", requireAuth, transcriptsRouter);
  api.use((_req, _res, next) => next(notFound("API route not found.")));
  api.use(errorHandler);

  app.use("/api", api);
  return app;
}
