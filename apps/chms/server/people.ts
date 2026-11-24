import { peopleTable } from "@schema";
import type { PeopleInsertDb, PeopleSelectDb } from "@schema";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { calculateAge, toTitleCase } from "@sda-chms/shared/utils/helpers";
import { eq } from "void/db";

import type { QueryDatabase, WriteDatabase } from "./db";

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

export const getAllPeopleWithHouseholdRows = (db: QueryDatabase) =>
  db.query.peopleTable.findMany({
    with: {
      household: { columns: householdContactColumns },
    },
  });

export const getPersonRowById = (db: QueryDatabase, id: string) =>
  db.query.peopleTable.findFirst({
    where: (table) => eq(table.id, id),
  });

export const getPersonWithHouseholdRowById = (db: QueryDatabase, id: string) =>
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
export const insertPersonStmt = (db: WriteDatabase, data: PeopleInsertDb) =>
  db.insert(peopleTable).values(data).returning();

export const updatePersonStmt = (
  db: WriteDatabase,
  id: string,
  data: Partial<PeopleInsertDb>
) => db.update(peopleTable).set(data).where(eq(peopleTable.id, id)).returning();

export const insertPerson = async (data: PeopleInsertDb, db: WriteDatabase) => {
  const person = await db.insert(peopleTable).values(data).returning();
  return person[0];
};

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

export const personApiToDb = (data: PersonInsertForm): PeopleInsertDb => ({
  ...personFormToDbFields(data),
  isActive: true,
});

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

export const NULL_PERSON_CONTACT = {
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  phone: null,
  preferredVisitingTime: null,
} as const;

export type PersonWithHouseholdApi = ReturnType<
  typeof personWithHouseholdDbToApi
>;
