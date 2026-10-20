import type { InferProps } from "void";
import { fetch } from "void/client";
import { defineHandler } from "void/handler";

/** Dashboard data: every person plus every household for the stat cards. */
export const loader = defineHandler(async () => {
  const [people, households] = await Promise.all([
    fetch("/api/people"),
    fetch("/api/households"),
  ]);
  return { people, households };
});

export type Props = InferProps<typeof loader>;
