import { defineMiddleware } from "void/handler";

import { mapErrorToBody } from "../server/lib/errors";

/** Void's own validator responses, rewritten into the ApiErrorBody contract. */
const VALIDATOR_ERRORS = new Set(["Validation failed", "Invalid JSON body"]);

/**
 * Maps every failure under `/api` to the single ApiErrorBody contract.
 * Non-`/api` paths pass through untouched.
 *
 * Hono converts a route-handler throw into its global onError response at the
 * route's own dispatch level, so an outer `try/catch` around `next()` never
 * fires — instead the original error is left on `c.error`, which is read and
 * remapped here. Responses Void's validators already produced are rewritten
 * after `next()`. Failures raised by Void itself above this middleware are
 * outside the contract.
 */
export default defineMiddleware(async (c, next) => {
  if (!c.req.path.startsWith("/api")) {
    return await next();
  }

  // oxlint-disable-next-line node/callback-return -- middleware continues after next() to remap the response
  await next();

  if (c.error !== undefined) {
    const { status, body } = mapErrorToBody(c.error);
    console.error(`🔴 ${body.code} ${body.message}`, c.error);
    c.res = c.json(body, status);
    return;
  }

  if (c.res.status === 400) {
    const payload = (await c.res.clone().json()) as {
      error?: unknown;
      issues?: unknown;
    };
    if (
      typeof payload.error === "string" &&
      VALIDATOR_ERRORS.has(payload.error)
    ) {
      c.res = c.json(
        {
          code: "VALIDATION_ERROR",
          message: payload.error,
          details: payload.issues,
        },
        400
      );
    }
  }
});
