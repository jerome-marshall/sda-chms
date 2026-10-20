import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import {
  addPerson,
  getAllPeopleWithHousehold,
} from "../../../../server/people";

export const GET = defineHandler(() => getAllPeopleWithHousehold());

export const POST = defineHandler.withValidator({
  body: personInsertFormSchema,
})((_c, { body }) => addPerson(body));
