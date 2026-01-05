import { db } from "@sda-chms/db";
import { type PeopleInsertDb, peopleTable } from "@sda-chms/db/schema/people";
import { withDbErrorHandling } from "src/lib/errors";

export const getAllPeople = () =>
  withDbErrorHandling(async () => {
    const people = await db.query.peopleTable.findMany();
    return people;
  }, "getAllPeople");

export const insertPerson = (data: PeopleInsertDb) =>
  withDbErrorHandling(async () => {
    const person = await db.insert(peopleTable).values(data).returning();
    return person[0];
  }, "insertPerson");
