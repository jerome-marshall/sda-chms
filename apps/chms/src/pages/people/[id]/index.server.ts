import type { InferProps } from "void";
import { fetch } from "void/client";
import { defineHandler } from "void/handler";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * Detail data: the person, their relationships, and every other person so
 * the relationships section can offer link candidates and spouse pre-fills.
 */
export const loader = defineHandler.withValidator({ params: paramsSchema })(
  async (_c, { params }) => {
    const [person, relationships, people] = await Promise.all([
      fetch("/api/people/:id", { params: { id: params.id } }),
      fetch("/api/relationships/person/:personId", {
        params: { personId: params.id },
      }),
      fetch("/api/people"),
    ]);
    return { person, relationships, people };
  }
);

export type Props = InferProps<typeof loader>;
