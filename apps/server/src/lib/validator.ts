import { zValidator } from "@hono/zod-validator";
import type { z } from "zod";

export const jsonValidator = <T extends z.ZodType>(schema: T) =>
  zValidator("json", schema, (result) => {
    if (!result.success) {
      throw result.error; // Let global errorHandler handle it
    }
  });
