import { Router } from "express";
import { AiError } from "@novaworks/ai";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { HttpError } from "../../lib/http-error.js";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { confirmCorrectedDraft, createFromTranscript, type TranscriptOutcome } from "./transcript.service.js";

export const transcriptsRouter = Router();
transcriptsRouter.use(requireRole("ADMIN"));

const createSchema = z.object({
  transcript: z.string().trim().min(1, "Transcript is empty.").max(100_000, "Transcript is too long."),
  replaceExisting: z.boolean().optional().default(false),
});

const taskSchema = z.object({
  title: z.string(),
  description: z.string(),
  assigneeId: z.string(),
  deadline: z.string(),
  estimatedHours: z.number().nullable(),
});
const confirmSchema = z.object({
  draft: z.object({
    projects: z.array(
      z.object({
        name: z.string(),
        clientName: z.string(),
        description: z.string(),
        managerId: z.string(),
        deadline: z.string(),
        tasks: z.array(taskSchema),
      }),
    ),
  }),
  replaceExisting: z.boolean().optional().default(false),
});

const send = (res: import("express").Response, outcome: TranscriptOutcome) =>
  res.status(outcome.status === "created" ? 201 : 422).json(outcome);

/** Admin pastes a transcript -> AI -> validate -> save (or return issues for correction). */
transcriptsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request.", "BAD_REQUEST");
    try {
      send(res, await createFromTranscript(currentUser(req).id, parsed.data.transcript, parsed.data.replaceExisting));
    } catch (err) {
      if (err instanceof AiError) {
        console.error("[ai]", err.code, err.attempts);
        const status = err.code === "AI_NOT_CONFIGURED" ? 503 : err.code === "AI_NO_PROJECTS" ? 422 : 502;
        throw new HttpError(status, err.message, err.code);
      }
      throw err;
    }
  }),
);

/** Admin submits a corrected draft -> revalidate -> save. */
transcriptsRouter.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const { draft, replaceExisting } = confirmSchema.parse(req.body);
    send(res, await confirmCorrectedDraft(currentUser(req).id, draft, replaceExisting));
  }),
);
