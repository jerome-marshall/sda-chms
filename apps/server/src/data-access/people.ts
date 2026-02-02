import { type DbTransaction, db } from "@sda-chms/db";
import {
  householdsTable,
  type PeopleInsertDb,
  peopleTable,
} from "@sda-chms/db/schema/people";
import { withDbErrorHandling } from "../lib/errors";

export const getAllPeople = () =>
  withDbErrorHandling(async () => {
    const people = await db.query.peopleTable.findMany();
    return people;
  }, "getAllPeople");

export const insertPerson = (data: PeopleInsertDb, trx: DbTransaction = db) =>
  withDbErrorHandling(async () => {
    const person = await trx.insert(peopleTable).values(data).returning();
    return person[0];
  }, "insertPerson");

export const insertHousehold = (trx: DbTransaction = db) =>
  withDbErrorHandling(async () => {
    const household = await trx.insert(householdsTable).values({}).returning();
    return household[0];
  }, "insertHousehold");
