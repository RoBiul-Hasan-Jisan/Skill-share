import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Centralized error handler — keeps controllers free of try/catch boilerplate.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = (err as { status?: number })?.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

/** Wrap async controllers so thrown errors hit errorHandler. */
export const asyncH =
  <T extends (...a: never[]) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(...([req, res, next] as never[]))).catch(next);
