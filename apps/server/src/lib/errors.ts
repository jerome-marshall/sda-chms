import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

export const errorHandler = (err: Error, c: Context): Response => {
  console.error("[Error]", err.message);

  if (err instanceof HTTPException) {
    return c.json<ApiErrorBody>(
      {
        code: "HTTP_ERROR",
        message: err.message,
      },
      err.status
    );
  }

  if (err instanceof z.ZodError) {
    return c.json<ApiErrorBody>(
      {
        code: "VALIDATION_ERROR",
        message: z.prettifyError(err),
        details: err,
      },
      400
    );
  }

  return c.json<ApiErrorBody>(
    {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    },
    500
  );
};
