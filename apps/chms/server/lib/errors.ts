import { getDbConstraintViolation, isDrizzleErrorLike } from "@schema";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

/** The error shape and status a route failure maps to. */
export interface MappedError {
  body: ApiErrorBody;
  status: ContentfulStatusCode;
}

/**
 * Normalizes any error into the single ApiErrorBody contract, exactly as the
 * legacy error handler did. Pure (no Response), so the Void middleware and
 * unit tests share it. `instanceof` is sound here: hono resolves to Void's
 * single pinned copy (enforced by test/version-parity.test.ts).
 *
 * Raw SQLite/D1 failures map here, once, instead of at every query site —
 * server code lets them propagate and this boundary turns recognized
 * constraint violations into DB_ERROR with the mapped status.
 */
export const mapErrorToBody = (err: unknown): MappedError => {
  if (err instanceof HTTPException) {
    return {
      status: err.status,
      body: { code: "HTTP_ERROR", message: err.message, details: err },
    };
  }

  if (err instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: z.prettifyError(err),
        details: err,
      },
    };
  }

  const violation = getDbConstraintViolation(err);
  if (violation) {
    return {
      status: violation.httpCode as ContentfulStatusCode,
      body: {
        code: "DB_ERROR",
        message: violation.constraint
          ? `${violation.constraint} - ${violation.message}`
          : violation.message,
        details: err,
      },
    };
  }

  // A Drizzle failure carries the raw SQL statement in its message, so it
  // must never reach the response body — the real error stays server-side.
  if (err instanceof Error && !isDrizzleErrorLike(err)) {
    return {
      status: 500,
      body: { code: "HTTP_ERROR", message: err.message, details: err },
    };
  }

  return {
    status: 500,
    body: {
      code: "HTTP_ERROR",
      message: isDrizzleErrorLike(err)
        ? "Internal Server Error"
        : "Unknown error",
      details: err,
    },
  };
};
