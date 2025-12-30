import { zValidator } from "@hono/zod-validator";
import { personInsertSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { getAllPeople } from "@/data-access/people";

const app = new Hono();

app.get("/", async (c) => {
  const people = await getAllPeople();
  return c.json(people);
});

app.post("/", zValidator("json", personInsertSchema), (c) => {
  return c.json("create a person", 201);
});

export default app;
