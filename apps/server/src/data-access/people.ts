import { type DbTransaction, eq, getDb } from "@sda-chms/db";
import {
  type HouseholdsInsertDb,
  householdsTable,
  type PeopleInsertDb,
  peopleTable,
} from "@sda-chms/db/schema/people";
import { withDbErrorHandling } from "../lib/errors";

/** The Household's own columns surfaced alongside each Person for the effective-value rule (ADR-0001). */
const householdContactColumns = {
  familyName: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  country: true,
  phone: true,
  preferredVisitingTime: true,
} as const;

/** Fetches all people with their Household's shared contact fields for the effective-value rule. */
export const getAllPeopleWithHousehold = () =>
  withDbErrorHandling(async () => {
    const people = await getDb().query.peopleTable.findMany({
      with: {
        household: { columns: householdContactColumns },
      },
    });
    return people;
  }, "getAllPeople");

/** Inserts a person record, optionally within an existing transaction. */
export const insertPerson = (
  data: PeopleInsertDb,
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const person = await trx.insert(peopleTable).values(data).returning();
    return person[0];
  }, "insertPerson");

/** The Household's stored fields set on create/update: the family name plus the shared contact details (ADR-0001). */
export type HouseholdWritableFields = Partial<
  Pick<
    HouseholdsInsertDb,
    | "familyName"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "state"
    | "country"
    | "phone"
    | "preferredVisitingTime"
  >
>;

/** Creates a household row with its stored fields — the head member is linked to it after insertion. */
export const insertHousehold = (
  data: HouseholdWritableFields = {},
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const household = await trx
      .insert(householdsTable)
      .values(data)
      .returning();
    return household[0];
  }, "insertHousehold");

/** Updates a household's stored fields (family name + shared contact details) by ID. */
export const updateHousehold = (
  id: string,
  data: HouseholdWritableFields,
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const result = await trx
      .update(householdsTable)
      .set(data)
      .where(eq(householdsTable.id, id))
      .returning();
    return result[0];
  }, "updateHousehold");

/** Fetches all households with their member list (used to build the household selector on the add-person form). */
export const getAllHouseholds = () =>
  withDbErrorHandling(async () => {
    const households = await getDb().query.householdsTable.findMany({
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

/** Fetches a single person without household data. */
export const getPersonById = (id: string) =>
  withDbErrorHandling(async () => {
    const person = await getDb().query.peopleTable.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    });
    return person;
  }, "getPersonById");

/** Updates a person record by ID, optionally within an existing transaction. */
export const updatePerson = (
  id: string,
  data: Partial<PeopleInsertDb>,
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const result = await trx
      .update(peopleTable)
      .set(data)
      .where(eq(peopleTable.id, id))
      .returning();
    return result[0];
  }, "updatePerson");

/** Fetches a single person with their Household's shared contact fields for the effective-value rule. */
export const getPersonWithHouseholdById = (id: string) =>
  withDbErrorHandling(async () => {
    const person = await getDb().query.peopleTable.findFirst({
      where: (table, { eq }) => eq(table.id, id),
      with: {
        household: { columns: householdContactColumns },
      },
    });
    return person;
  }, "getPersonWithHouseholdById");
