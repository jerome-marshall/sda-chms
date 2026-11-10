import { defineHandler } from "void/handler";
import { z } from "zod";

import { getPersonRelationships } from "../../../../../server/effect/relationships";
import { runApi } from "../../../../../server/effect/runtime";

const paramsSchema = z.object({ personId: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => runApi(getPersonRelationships(params.personId))
);
