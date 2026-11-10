import { relationshipUpdateSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

import {
  removeRelationship,
  updateRelationshipState,
} from "../../../../server/effect/relationships";
import { runApi } from "../../../../server/effect/runtime";

const paramsSchema = z.object({ id: z.string().min(1) });

export const PATCH = defineHandler.withValidator({
  params: paramsSchema,
  body: relationshipUpdateSchema,
})((_c, { body, params }) =>
  runApi(updateRelationshipState(params.id, body.state))
);

export const DELETE = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => runApi(removeRelationship(params.id))
);
