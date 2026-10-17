import {
  addPersonUseCase,
  getAllPeopleWithHouseholdUseCase,
} from "@sda-chms/server/use-case/people";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

export const GET = defineHandler(() => getAllPeopleWithHouseholdUseCase());

export const POST = defineHandler.withValidator({
  body: personInsertFormSchema,
})((_c, { body }) => addPersonUseCase(body));
