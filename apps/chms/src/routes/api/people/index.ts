import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import { addPerson, getAllPeople } from "../../../../server/effect/people";
import { runApi } from "../../../../server/effect/runtime";

export const GET = defineHandler(() => runApi(getAllPeople));

export const POST = defineHandler.withValidator({
  body: personInsertFormSchema,
})((_c, { body }) => runApi(addPerson(body)));
