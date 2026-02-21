import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { jsonValidator } from "../lib/validator";
import {
  addPersonUseCase,
  getAllPeopleWithHeadUseCase,
  getPersonByIdUseCase,
} from "../use-case/people";

const app = new Hono()
  .get("/", async (c) => {
    const people = await getAllPeopleWithHeadUseCase();
    return c.json(people, 200);
  })
  .post("/", jsonValidator(personInsertFormSchema), async (c) => {
    const data = await c.req.valid("json");
    console.log("🚀 ~ data:", data);
    const person = await addPersonUseCase(data);
    return c.json(person, 201);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const person = await getPersonByIdUseCase(id);
    return c.json(person, 200);
  });

export default app;
