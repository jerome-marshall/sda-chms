import { zValidator } from "@hono/zod-validator";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { getAllGroupsUseCase } from "../use-case/groups";

const app = new Hono()
  .get("/", async (c) => {
    const groups = await getAllGroupsUseCase();
    return c.json(groups, 200);
  })
  .post("/", zValidator("json", personInsertFormSchema), (c) => {
    return c.json("create a person", 201);
  });

export default app;
