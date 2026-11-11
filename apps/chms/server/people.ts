import { peopleTable } from "@schema";
import type { PeopleInsertDb, PeopleSelectDb } from "@schema";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { calculateAge, toTitleCase } from "@sda-chms/shared/utils/helpers";
import { eq } from "void/db";

import type { Database } from "./db";

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
export const getAllPeopleWithHouseholdRows = (db: Database) =>
  db.query.peopleTable.findMany({
    with: {
      household: { columns: householdContactColumns },
    },
  });

/** Fetches a single person without household data. */
export const getPersonRowById = (db: Database, id: string) =>
  db.query.peopleTable.findFirst({
    where: (table) => eq(table.id, id),
  });

/** Fetches a single person with their Household's shared contact fields for the effective-value rule. */
export const getPersonWithHouseholdRowById = (db: Database, id: string) =>
  db.query.peopleTable.findFirst({
    where: (table) => eq(table.id, id),
    with: {
      household: { columns: householdContactColumns },
    },
  });

/**
 * Batch statement builders. D1 has no transactions, so multi-write operations
 * compose these (un-executed) builders and issue one `getDb().batch([...])`.
 * The executing wrappers stay for single-write callers and tests.
 */

/** Lazy person insert used inside a batch; the caller reads row [0] of its result. */
export const insertPersonStmt = (db: Database, data: PeopleInsertDb) =>
  db.insert(peopleTable).values(data).returning();

/** Lazy person update used inside a batch. */
export const updatePersonStmt = (
  db: Database,
  id: string,
  data: Partial<PeopleInsertDb>
) => db.update(peopleTable).set(data).where(eq(peopleTable.id, id)).returning();

/** Inserts a person record (single write; batch paths use `insertPersonStmt`). */
export const insertPerson = async (data: PeopleInsertDb, db: Database) => {
  const person = await db.insert(peopleTable).values(data).returning();
  return person[0];
};

// Inferred from the query so it stays in sync with the selected columns.
type PersonWithHouseholdRow = Awaited<
  ReturnType<typeof getAllPeopleWithHouseholdRows>
>[number];

/**
 * Drops the stored identity_* dedupe helpers so they never reach the API wire
 * shape. They exist only for the unique index (SQLite treats nulls as
 * distinct, so the coalesced columns reproduce the old NULLS NOT DISTINCT
 * semantics); no reader needs them.
 */
const stripIdentityColumns = <T extends PeopleSelectDb>(
  // oxlint-disable-next-line no-unused-vars -- destructured out to omit them from the wire shape
  { identityLastName, identityDateOfBirth, ...publicRow }: T
): Omit<T, "identityLastName" | "identityDateOfBirth"> => publicRow;

/** Shared field mapping used by both insert and update transformers. */
export const personFormToDbFields = (
  data: PersonInsertForm
): Omit<PeopleInsertDb, "isActive"> => ({
  firstName: toTitleCase(data.firstName),
  lastName: data.lastName ? toTitleCase(data.lastName) : data.lastName,
  phone: data.phone,
  occupation: data.occupation,
  fathersName: data.fathersName,
  mothersName: data.mothersName,
  maritalStatus: data.maritalStatus,
  membershipStatus: data.membershipStatus,
  dietaryPreference: data.dietaryPreference,
  preferredVisitingTime: data.preferredVisitingTime,
  addressLine1: data.addressLine1,
  addressLine2: data.addressLine2,
  city: data.city,
  state: data.state,
  country: data.country,
  visitationNotes: data.visitationNotes,
  weddingDate: data.weddingDate,
  memorialDay: data.memorialDay,
  baptismDate: data.baptismDate,
  baptismPlace: data.baptismPlace,
  dateJoinedChurch: data.dateJoinedChurch,
  dateOfBirth: data.dateOfBirth,
  email: data.email,
  photoUrl: data.photoUrl,
  gender: data.gender,
  preferredName: data.preferredName,
  householdId: data.householdId,
  householdRole: data.householdRole,
  sabbathSchoolClass: data.sabbathSchoolClass,
  pastoralNotes: data.pastoralNotes,
  importantDates: data.importantDates ?? [],
});

/** Maps the client-submitted form data to the DB insert shape, title-casing names before storage. */
export const personApiToDb = (data: PersonInsertForm): PeopleInsertDb => ({
  ...personFormToDbFields(data),
  isActive: true,
});

/**
 * Transforms a person + their Household DB record into the API shape (ADR-0001).
 * Surfaces the Household's shared contact fields (`household*`) alongside the
 * person's own so every reader can resolve the effective value — the person's
 * own if set, otherwise the Household's. No head-of-household fallback remains.
 */
export const personWithHouseholdDbToApi = (
  personData: PersonWithHouseholdRow
) => {
  const { household, ...personDataWithoutHousehold } = personData;
  const publicRow = stripIdentityColumns(personDataWithoutHousehold);
  return {
    ...publicRow,
    fullName: `${publicRow.firstName} ${publicRow.lastName ?? ""}`.trim(),
    age: calculateAge(publicRow.dateOfBirth),
    isHeadOfHousehold: publicRow.householdRole === HOUSEHOLD_ROLE.HEAD,
    // The Household's shared contact details, inherited unless the person
    // overrides with their own value of the same name.
    householdFamilyName: household?.familyName ?? null,
    householdAddressLine1: household?.addressLine1 ?? null,
    householdAddressLine2: household?.addressLine2 ?? null,
    householdCity: household?.city ?? null,
    householdState: household?.state ?? null,
    householdCountry: household?.country ?? null,
    householdPhone: household?.phone ?? null,
    householdPreferredVisitingTime: household?.preferredVisitingTime ?? null,
  };
};

/** The person columns that mirror the Household's shared contact fields, cleared so a Head inherits from the Household. */
export const NULL_PERSON_CONTACT = {
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  phone: null,
  preferredVisitingTime: null,
} as const;

/** The Person wire shape returned by every People read (ADR-0007). */
export type PersonWithHouseholdApi = ReturnType<
  typeof personWithHouseholdDbToApi
>;
