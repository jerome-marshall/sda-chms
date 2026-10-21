import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import {
  addPersonUseCase,
  getAllPeopleWithHouseholdUseCase,
} from "../../../server/use-case/people";

export const GET = defineHandler(() => getAllPeopleWithHouseholdUseCase());

export const POST = defineHandler.withValidator({
  body: personInsertFormSchema,
})((_c, { body }) => addPersonUseCase(body));
