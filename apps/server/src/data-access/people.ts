import { db } from "@sda-chms/db";
import { type PeopleInsertDb, peopleTable } from "@sda-chms/db/schema/people";

export const getAllPeople = async () => {
  const people = await db.query.peopleTable.findMany();
  return people;
};

export const insertPerson = async (data: PeopleInsertDb) => {
  const person = await db.insert(peopleTable).values(data).returning();
  return person[0];
};
