import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { InferProps } from "void";
import { fetch, FetchError } from "void/client";
import { defineHandler } from "void/handler";

/** Household options for the role select on the add form. */
export const loader = defineHandler(async () => {
  const households = await fetch("/api/households");
  return { households };
});

export const action = defineHandler.withValidator({
  body: personInsertFormSchema,
})(async (c, { body }) => {
  try {
    const person = await fetch("/api/people", { method: "POST", body });
    return c.redirect(`/people/${person.id}`);
  } catch (error) {
    // Forward the API failure (409 duplicate, 400 validation) so the form
    // sees the same contract body it would get calling the API directly.
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
