import { getDbConstraintViolation } from "@schema";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { HTTPException } from "hono/http-exception";
import type { ClientErrorStatusCode } from "hono/utils/http-status";
import { z } from "zod";

/**
 * The only 500 body. A server fault's message can carry SQL, bound values or
 * D1 detail, so the cause stays in the log and the wire gets this constant.
 */
export const INTERNAL_ERROR = {
  status: 500,
  body: { code: "HTTP_ERROR", message: "Internal Server Error" },
} as const satisfies { status: 500; body: ApiErrorBody };

/** A failure the caller caused, with a body written for them, or the fixed 500. */
export type MappedError =
  | { body: ApiErrorBody; status: ClientErrorStatusCode }
  | typeof INTERNAL_ERROR;

const isClientError = (status: number): status is ClientErrorStatusCode =>
  status >= 400 && status < 500;

/**
 * Normalizes any error into the single ApiErrorBody contract. Pure, so the
 * Void middleware and unit tests share it. `instanceof` is sound here: hono
 * resolves to Void's single pinned copy (enforced by test/version-parity.test.ts).
 */
export const mapErrorToBody = (err: unknown): MappedError => {
  if (err instanceof HTTPException && isClientError(err.status)) {
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
  if (violation && isClientError(violation.httpCode)) {
    return {
      status: violation.httpCode,
      body: {
        code: "DB_ERROR",
        message: violation.constraint
          ? `${violation.constraint} - ${violation.message}`
          : violation.message,
        constraint: violation.constraint,
      },
    };
  }

  return INTERNAL_ERROR;
};
