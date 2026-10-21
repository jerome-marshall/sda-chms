import { relationshipCreateSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import { addRelationship } from "../../../../server/relationships";

export const POST = defineHandler.withValidator({
  body: relationshipCreateSchema,
})((_c, { body }) => addRelationship(body));
