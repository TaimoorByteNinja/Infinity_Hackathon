export type AiErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_AUTH_FAILED"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_OUTPUT"
  | "AI_NO_PROJECTS";

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly attempts: string[] = [],
  ) {
    super(message);
    this.name = "AiError";
  }
}
