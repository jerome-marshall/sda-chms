import { type DbTransaction, db } from "@sda-chms/db";
import {
  householdsTable,
  type PeopleInsertDb,
  peopleTable,
} from "@sda-chms/db/schema/people";
import { withDbErrorHandling } from "../lib/errors";

/** Fetches all people with their household head's contact fields for the head-of-household fallback. */
export const getAllPeopleWithHead = () =>
  withDbErrorHandling(async () => {
    const people = await db.query.peopleTable.findMany({
      with: {
        household: {
          with: {
            members: {
              where: (member, { eq }) => eq(member.householdRole, "head"),
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                preferredVisitingTime: true,
                phone: true,
              },
              limit: 1,
            },
          },
          columns: {}, // household itself has no useful fields; we only need its members
        },
      },
    });
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

export const getAllHouseholds = () =>
  withDbErrorHandling(async () => {
    const households = await db.query.householdsTable.findMany({
      with: {
        members: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            country: true,
            householdRole: true,
          },
        },
      },
    });
    return households;
  }, "getAllHouseholds");

export const getPersonById = (id: string) =>
  withDbErrorHandling(async () => {
    const person = await db.query.peopleTable.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    });
    return person;
  }, "getPersonById");
