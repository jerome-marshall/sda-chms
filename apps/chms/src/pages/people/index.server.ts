import type { InferProps } from "void";
import { fetch } from "void/client";
import { defineHandler } from "void/handler";

export const loader = defineHandler(async () => {
  const people = await fetch("/api/people");
  return { people };
});

export type Props = InferProps<typeof loader>;
