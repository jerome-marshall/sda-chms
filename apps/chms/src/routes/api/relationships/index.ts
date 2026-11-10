import { relationshipCreateSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import { addRelationship } from "../../../../server/effect/relationships";
import { runApi } from "../../../../server/effect/runtime";

export const POST = defineHandler.withValidator({
  body: relationshipCreateSchema,
})((_c, { body }) => runApi(addRelationship(body)));
