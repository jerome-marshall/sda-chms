import { zValidator } from "@hono/zod-validator";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { getAllPeople } from "../data-access/people";
import { addPersonUseCase } from "../use-case/people";

const app = new Hono()
  .get("/", async (c) => {
    const people = await getAllPeople();
    return c.json(people, 200);
  })
  .post("/", zValidator("json", personInsertFormSchema), async (c) => {
    const data = await c.req.valid("json");
    console.log("🚀 ~ data:", data);
    try {
      const person = await addPersonUseCase(data);
      return c.json(person, 201);
    } catch (error) {
      return c.json({ error: "Failed to create person", stack: error }, 500);
    }
  });

export default app;
