import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { getAllPeople, insertPerson } from "../data-access/people";
import { peopleDbToApi, personApiToDb } from "../transformers/people";

export const getAllPeopleUseCase = async () => {
  const people = await getAllPeople();
  return peopleDbToApi(people);
};

export const addPersonUseCase = async (data: PersonInsertForm) => {
  const person = await insertPerson(personApiToDb(data));
  return person;
};
