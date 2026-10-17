import { Hono } from "hono";

import { getAllGroupsUseCase } from "../../../web/server/use-case/groups";

const app = new Hono().get("/", async (c) => {
  const groups = await getAllGroupsUseCase();
  return c.json(groups, 200);
});

export default app;
