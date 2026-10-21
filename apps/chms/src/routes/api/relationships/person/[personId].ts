import { defineHandler } from "void/handler";
import { z } from "zod";

import { getPersonRelationships } from "../../../../../server/relationships";

const paramsSchema = z.object({ personId: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => getPersonRelationships(params.personId)
);
