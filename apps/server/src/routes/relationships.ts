import { relationshipCreateSchema } from "@sda-chms/shared/schema/people";
import { Hono } from "hono";
import { jsonValidator } from "../lib/validator";
import {
  addRelationshipUseCase,
  getPersonRelationshipsUseCase,
  removeRelationshipUseCase,
} from "../use-case/relationships";

const app = new Hono()
  .post("/", jsonValidator(relationshipCreateSchema), async (c) => {
    const data = await c.req.valid("json");
    const relationship = await addRelationshipUseCase(data);
    return c.json(relationship, 201);
  })
  .get("/person/:personId", async (c) => {
    const personId = c.req.param("personId");
    const relationships = await getPersonRelationshipsUseCase(personId);
    return c.json(relationships, 200);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await removeRelationshipUseCase(id);
    return c.json(result, 200);
  });

export default app;
