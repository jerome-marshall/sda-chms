import { defineHandler } from "void/handler";
import { z } from "zod";

import { getPersonRelationshipsUseCase } from "../../../../server/use-case/relationships";

const paramsSchema = z.object({ personId: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => getPersonRelationshipsUseCase(params.personId)
);
