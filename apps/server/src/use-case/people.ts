import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { getAllPeople, insertPerson } from "../data-access/people";
import { personApiToDb } from "../transformers/people";

export const getAllPeopleUseCase = async () => {
  const people = await getAllPeople();
  return people;
};

export const addPersonUseCase = async (data: PersonInsertForm) => {
  const person = await insertPerson(personApiToDb(data));
  return person;
};
