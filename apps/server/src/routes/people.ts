import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { getAllPeople } from "../data-access/people";
import { jsonValidator } from "../lib/validator";
import { addPersonUseCase } from "../use-case/people";

const app = new Hono()
  .get("/", async (c) => {
    const people = await getAllPeople();
    return c.json(people, 200);
  })
  .post("/", jsonValidator(personInsertFormSchema), async (c) => {
    const data = await c.req.valid("json");
    console.log("🚀 ~ data:", data);
    const person = await addPersonUseCase(data);
    return c.json(person, 201);
  });

export default app;
