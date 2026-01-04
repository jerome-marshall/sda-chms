import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { insertPerson } from "../data-access/people";
import { personApiToDb } from "../transformers/people";

export const addPersonUseCase = async (data: PersonInsertForm) => {
  const person = await insertPerson(personApiToDb(data));
  return person;
};
