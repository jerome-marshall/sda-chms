import { zValidator } from "@hono/zod-validator";
import type { z } from "zod";

/** Hono middleware that validates JSON request bodies against a Zod schema, throwing on failure so the global errorHandler formats the response. */
export const jsonValidator = <T extends z.ZodType>(schema: T) =>
  zValidator("json", schema, (result) => {
    if (!result.success) {
      // The global errorHandler formats ZodError as a 400, so it must be thrown as-is.
      // oxlint-disable-next-line typescript/only-throw-error
      throw result.error;
    }
  });
