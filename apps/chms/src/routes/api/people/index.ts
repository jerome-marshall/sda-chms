import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import { defineHandler } from "void/handler";

import { getAllPeople } from "../../../../server/effect/people";
import { runEffect } from "../../../../server/effect/runtime";
import { addPerson } from "../../../../server/people";

export const GET = defineHandler(() => runEffect(getAllPeople));

export const POST = defineHandler.withValidator({
  body: personInsertFormSchema,
})((_c, { body }) => addPerson(body));
