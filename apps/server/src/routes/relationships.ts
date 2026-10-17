import {
  relationshipCreateSchema,
  relationshipUpdateSchema,
} from "@sda-chms/shared/schema/people";
import { Hono } from "hono";

import {
  addRelationshipUseCase,
  getPersonRelationshipsUseCase,
  removeRelationshipUseCase,
  updateRelationshipStateUseCase,
} from "../../../web/server/use-case/relationships";
import { jsonValidator } from "../lib/validator";

const app = new Hono()
  .post("/", jsonValidator(relationshipCreateSchema), async (c) => {
    const data = c.req.valid("json");
    const relationship = await addRelationshipUseCase(data);
    return c.json(relationship, 201);
  })
  .get("/person/:personId", async (c) => {
    const personId = c.req.param("personId");
    const relationships = await getPersonRelationshipsUseCase(personId);
    return c.json(relationships, 200);
  })
  .patch("/:id", jsonValidator(relationshipUpdateSchema), async (c) => {
    const id = c.req.param("id");
    const { state } = c.req.valid("json");
    const relationship = await updateRelationshipStateUseCase(id, state);
    return c.json(relationship, 200);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await removeRelationshipUseCase(id);
    return c.json(result, 200);
  });

export default app;
