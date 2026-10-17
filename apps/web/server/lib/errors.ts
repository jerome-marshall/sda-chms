import { getDbErrorMessage } from "@schema";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { DbError } from "@sda-chms/shared/utils/errors";
import type { Context } from "hono";
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

  return {
    status: 500,
    body: {
      code: "HTTP_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
      details: err,
    },
  };
};

/** Global Hono error handler — normalizes all errors into a consistent ApiErrorBody JSON response. */
export const errorHandler = (err: Error, c: Context): Response => {
  const { status, body } = mapErrorToBody(err);

  console.error(`🔴 ${body.code} ${body.message}`);

  return c.json<ApiErrorBody>(body, status);
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
