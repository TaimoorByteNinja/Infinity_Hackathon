export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, "BAD_REQUEST", details);
export const unauthorized = (msg = "Please log in.") => new HttpError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "You do not have access to this resource.") => new HttpError(403, msg, "FORBIDDEN");
export const notFound = (msg = "Not found.") => new HttpError(404, msg, "NOT_FOUND");
