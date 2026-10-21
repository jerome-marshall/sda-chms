import { relationshipUpdateSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

import {
  removeRelationshipUseCase,
  updateRelationshipStateUseCase,
} from "../../../server/use-case/relationships";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = defineHandler.withValidator({
  params: paramsSchema,
  body: relationshipUpdateSchema,
})((_c, { body, params }) =>
  updateRelationshipStateUseCase(params.id, body.state)
);

export const DELETE = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => removeRelationshipUseCase(params.id)
);
