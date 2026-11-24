import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { InferProps } from "void";
import { fetch, FetchError } from "void/client";
import { defineHandler } from "void/handler";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const loader = defineHandler.withValidator({ params: paramsSchema })(
  async (_c, { params }) => {
    const [person, relationships, households, people] = await Promise.all([
      fetch("/api/people/:id", { params: { id: params.id } }),
      fetch("/api/relationships/person/:personId", {
        params: { personId: params.id },
      }),
      fetch("/api/households"),
      fetch("/api/people"),
    ]);
    return { person, relationships, households, people };
  }
);

export const action = defineHandler.withValidator({
  params: paramsSchema,
  body: personInsertFormSchema,
})(async (c, { body, params }) => {
  try {
    const updated = await fetch("/api/people/:id", {
      method: "PUT",
      params: { id: params.id },
      body,
    });
    return c.redirect(`/people/${updated.id}`);
  } catch (error) {
    if (error instanceof FetchError) {
      return c.json(
        error.data ?? { message: error.message },
        (error.status ?? 500) as ContentfulStatusCode
      );
    }
    throw error;
  }
});

export type Props = InferProps<typeof loader>;
