import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

import {
  getPersonWithHouseholdByIdUseCase,
  updatePersonUseCase,
} from "../../../server/use-case/people";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => getPersonWithHouseholdByIdUseCase(params.id)
);

export const PUT = defineHandler.withValidator({
  params: paramsSchema,
  body: personInsertFormSchema,
})((_c, { body, params }) => updatePersonUseCase(params.id, body));
