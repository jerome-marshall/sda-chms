import {
  getPersonWithHouseholdByIdUseCase,
  updatePersonUseCase,
} from "@sda-chms/server/use-case/people";
import { personUpdateFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1) });

export const GET = defineHandler.withValidator({ params: paramsSchema })(
  (_c, { params }) => getPersonWithHouseholdByIdUseCase(params.id)
);

export const PUT = defineHandler.withValidator({
  params: paramsSchema,
  body: personUpdateFormSchema,
})((_c, { body, params }) => updatePersonUseCase(params.id, body));
