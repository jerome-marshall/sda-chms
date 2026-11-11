import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

import { getPersonById, updatePerson } from "../../../../server/effect/people";
import { runApi } from "../../../../server/effect/runtime";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => runApi(getPersonById(params.id))
);

export const PUT = defineHandler.withValidator({
  params: paramsSchema,
  body: personInsertFormSchema,
})((_c, { body, params }) => runApi(updatePerson(params.id, body)));
