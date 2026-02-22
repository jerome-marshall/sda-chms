import { zValidator } from "@hono/zod-validator";
import type { z } from "zod";

/** Hono middleware that validates JSON request bodies against a Zod schema, throwing on failure so the global errorHandler formats the response. */
export const jsonValidator = <T extends z.ZodType>(schema: T) =>
  zValidator("json", schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
