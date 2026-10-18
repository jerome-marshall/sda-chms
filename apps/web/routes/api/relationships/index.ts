import { relationshipCreateSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import { addRelationshipUseCase } from "../../../server/use-case/relationships";

export const POST = defineHandler.withValidator({
  body: relationshipCreateSchema,
})((_c, { body }) => addRelationshipUseCase(body));
