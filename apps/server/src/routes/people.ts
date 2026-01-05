import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { jsonValidator } from "../lib/validator";
import { addPersonUseCase, getAllPeopleUseCase } from "../use-case/people";

const app = new Hono()
  .get("/", async (c) => {
    const people = await getAllPeopleUseCase();
    return c.json(people, 200);
  })
  .post("/", jsonValidator(personInsertFormSchema), async (c) => {
    const data = await c.req.valid("json");
    console.log("🚀 ~ data:", data);
    const person = await addPersonUseCase(data);
    return c.json(person, 201);
  });

export default app;
