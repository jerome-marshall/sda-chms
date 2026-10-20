import { getDbErrorMessage, isDrizzleErrorLike } from "@schema";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { DbError } from "@sda-chms/shared/utils/errors";
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

  if (err instanceof DbError) {
    return {
      status: err.httpCode as ContentfulStatusCode,
      body: {
        code: "DB_ERROR",
        message: err.constraint
          ? `${err.constraint} - ${err.message}`
          : err.message,
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

/** Wraps a data-access operation, catching raw DB errors and re-throwing them as DbError with a user-friendly message. */
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const { message, constraint, httpCode } = getDbErrorMessage(error);

    console.error("🔴 Database operation failed:", {
      context,
      message,
      constraint,
    });

    throw new DbError(message, constraint, httpCode);
  }
};
