import { getDbErrorMessage } from "@sda-chms/db/schema/lib/db-errors";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { DbError } from "@sda-chms/shared/utils/errors";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import z from "zod";

/** Global Hono error handler — normalizes all errors into a consistent ApiErrorBody JSON response. */
export const errorHandler = (err: Error, c: Context): Response => {
  let message = err.message;
  let code: ApiErrorBody["code"] = "HTTP_ERROR";
  let details: ApiErrorBody["details"] = err;
  let status: ContentfulStatusCode = 500;

  if (err instanceof HTTPException) {
    status = err.status;
  }

  if (err instanceof z.ZodError) {
    message = z.prettifyError(err);
    code = "VALIDATION_ERROR";
    details = err;
    status = 400;
  }

  if (err instanceof DbError) {
    message = err.constraint
      ? `${err.constraint} - ${err.message}`
      : err.message;
    code = "DB_ERROR";
    details = err;
    status = err.httpCode as ContentfulStatusCode;
  }

  console.error(`🔴 ${code} ${message}`);

  return c.json<ApiErrorBody>(
    {
      code,
      message,
      details,
    },
    status
  );
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
