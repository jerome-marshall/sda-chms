import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

import { getPersonWithHousehold, updatePerson } from "../../../server/people";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => getPersonWithHousehold(params.id)
);

export const PUT = defineHandler.withValidator({
  params: paramsSchema,
  body: personInsertFormSchema,
})((_c, { body, params }) => updatePerson(params.id, body));
