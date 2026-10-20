import { peopleTable } from "@schema";
import type { PeopleInsertDb, PeopleSelectDb } from "@schema";
import { HOUSEHOLD_ROLE } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { calculateAge, toTitleCase } from "@sda-chms/shared/utils/helpers";
import { HTTPException } from "hono/http-exception";
import { eq } from "void/db";

import { getDb } from "./db";
import { insertHouseholdStmt, updateHouseholdStmt } from "./households";
import {
  getGoverningMaritalStatus,
  planMaritalStatusUpdates,
  readSpouseLinkGraph,
} from "./marital-status";

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
const getAllPeopleWithHouseholdRows = () =>
  getDb().query.peopleTable.findMany({
    with: {
      household: { columns: householdContactColumns },
    },
  });

/** Fetches a single person without household data. */
export const getPersonById = (id: string) =>
  getDb().query.peopleTable.findFirst({
    where: (table) => eq(table.id, id),
  });

/** Fetches a single person with their Household's shared contact fields for the effective-value rule. */
const getPersonWithHouseholdRowById = (id: string) =>
  getDb().query.peopleTable.findFirst({
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
export const insertPersonStmt = (data: PeopleInsertDb) =>
  getDb().insert(peopleTable).values(data).returning();

/** Lazy person update used inside a batch. */
export const updatePersonStmt = (id: string, data: Partial<PeopleInsertDb>) =>
  getDb()
    .update(peopleTable)
    .set(data)
    .where(eq(peopleTable.id, id))
    .returning();

/** Inserts a person record (single write; batch paths use `insertPersonStmt`). */
export const insertPerson = async (data: PeopleInsertDb) => {
  const person = await getDb().insert(peopleTable).values(data).returning();
  return person[0];
};

/** Updates a person record by ID (single write; batch paths use `updatePersonStmt`). */
export const updatePersonById = async (
  id: string,
  data: Partial<PeopleInsertDb>
) => {
  const result = await getDb()
    .update(peopleTable)
    .set(data)
    .where(eq(peopleTable.id, id))
    .returning();
  return result[0];
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
const personFormToDbFields = (
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
const personApiToDb = (data: PersonInsertForm): PeopleInsertDb => ({
  ...personFormToDbFields(data),
  isActive: true,
});

/** Maps the client-submitted update form data to the DB shape without overriding isActive. */
const personUpdateApiToDb = (
  data: PersonInsertForm
): Omit<PeopleInsertDb, "isActive"> => personFormToDbFields(data);

/** Adds computed fields (fullName, age) to a DB person record for the API response. */
const personDbToApi = (personData: PeopleSelectDb) => {
  const publicRow = stripIdentityColumns(personData);
  return {
    ...publicRow,
    fullName: `${publicRow.firstName} ${publicRow.lastName ?? ""}`.trim(),
    age: calculateAge(publicRow.dateOfBirth),
  };
};

/**
 * Transforms a person + their Household DB record into the API shape (ADR-0001).
 * Surfaces the Household's shared contact fields (`household*`) alongside the
 * person's own so every reader can resolve the effective value — the person's
 * own if set, otherwise the Household's. No head-of-household fallback remains.
 */
const personWithHouseholdDbToApi = (personData: PersonWithHouseholdRow) => {
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
    household: undefined, // strip the raw join from the API response
  };
};

/** The shared contact fields the Household owns; pulled off a person form to store on the Household. */
const householdContactFromForm = (data: PersonInsertForm) => ({
  addressLine1: data.addressLine1 || null,
  addressLine2: data.addressLine2 || null,
  city: data.city || null,
  state: data.state || null,
  country: data.country || null,
  phone: data.phone || null,
  preferredVisitingTime: data.preferredVisitingTime || null,
});

/** The person columns that mirror the Household's shared contact fields, cleared so a Head inherits from the Household. */
const NULL_PERSON_CONTACT = {
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  phone: null,
  preferredVisitingTime: null,
} as const;

/** Returns all people with their Household's shared contact fields for the people list view. */
export const getAllPeopleWithHousehold = async () => {
  const people = await getAllPeopleWithHouseholdRows();
  return people.map(personWithHouseholdDbToApi);
};

/** Returns a single person without the Household's shared contact fields (used internally). */
export const getPersonApiById = async (id: string) => {
  const person = await getPersonById(id);
  if (!person) {
    throw new Error("Person not found");
  }
  return personDbToApi(person);
};

/** Retrieves a person by ID with their Household's shared contact fields for the effective-value rule. */
export const getPersonWithHousehold = async (id: string) => {
  const person = await getPersonWithHouseholdRowById(id);
  if (!person) {
    throw new Error("Person not found");
  }
  return personWithHouseholdDbToApi(person);
};

/**
 * Creates a new person. If the person is a head-of-household, a new household is
 * created and linked automatically.
 *
 * D1 shape: validation first, the household id client-generated (no write
 * depends on another write's result), then one `db.batch` holding the
 * household insert and the person insert together. A member with a household
 * is a single insert and needs no batch.
 */
export const addPerson = async (data: PersonInsertForm) => {
  const personData = personApiToDb(data);

  if (!data.householdId && data.householdRole !== HOUSEHOLD_ROLE.HEAD) {
    throw new Error("Only Head of Household can create a household");
  }

  let personFinal: Awaited<ReturnType<typeof insertPerson>>;
  if (data.householdId) {
    personFinal = await insertPerson(personData);
  } else {
    // The head defines the household: their contact details seed the
    // Household's shared values and are cleared on the person, who then
    // inherits them (no duplication — ADR-0001).
    const householdId = crypto.randomUUID();
    const [, personRows] = await getDb().batch([
      insertHouseholdStmt({
        id: householdId,
        familyName: data.familyName,
        ...householdContactFromForm(data),
      }),
      insertPersonStmt({
        ...personData,
        ...NULL_PERSON_CONTACT,
        householdId,
      }),
    ]);
    personFinal = personRows[0];
  }

  if (!personFinal) {
    throw new Error("Failed to create person");
  }

  return personDbToApi(personFinal);
};

/**
 * Updates an existing person. Applies the same household rules as addPerson:
 * heads without a household get a new one created automatically.
 *
 * D1 shape: reads first (governing-link check, current row, spouse-link
 * graph), the post-write state computed in memory (including a membership
 * override when Membership Status changes — a change to Deceased can flip a
 * partner's derived widowhood), then one `db.batch` with the household /
 * person writes plus every Marital Status rewrite.
 */
export const updatePerson = async (id: string, data: PersonInsertForm) => {
  // A governing spouse link is the source of truth (ADR-0003); a manual value
  // that disagrees is rejected so the two cannot drift (issue #8).
  const governingMaritalStatus = await getGoverningMaritalStatus(id);
  if (governingMaritalStatus && data.maritalStatus !== governingMaritalStatus) {
    throw new HTTPException(400, {
      message:
        "Marital Status follows the spouse Relationship and cannot contradict it",
    });
  }

  const current = await getPersonWithHouseholdRowById(id);
  if (!current) {
    throw new Error("Person not found");
  }

  if (!data.householdId && data.householdRole !== HOUSEHOLD_ROLE.HEAD) {
    throw new Error("Only Head of Household can create a household");
  }

  const personData = personUpdateApiToDb(data);
  const { rows, affected } = await readSpouseLinkGraph([id]);
  const overrides = new Map([
    [id, data.membershipStatus ?? current.membershipStatus],
  ]);
  const plans = planMaritalStatusUpdates(rows, affected, overrides);
  const maritalStmts = plans.map((plan) =>
    updatePersonStmt(plan.personId, { maritalStatus: plan.maritalStatus })
  );

  if (!data.householdId) {
    const householdId = crypto.randomUUID();
    await getDb().batch([
      insertHouseholdStmt({
        id: householdId,
        familyName: data.familyName,
        ...householdContactFromForm(data),
      }),
      updatePersonStmt(id, {
        ...personData,
        ...NULL_PERSON_CONTACT,
        householdId,
      }),
      ...maritalStmts,
    ]);
  } else if (data.householdRole === HOUSEHOLD_ROLE.HEAD) {
    // A head editing their own household updates the shared family name and
    // contact details on the Household; their own contact columns stay cleared
    // so they keep inheriting the shared values (ADR-0001).
    await getDb().batch([
      updatePersonStmt(id, { ...personData, ...NULL_PERSON_CONTACT }),
      updateHouseholdStmt(data.householdId, {
        familyName: data.familyName,
        ...householdContactFromForm(data),
      }),
      ...maritalStmts,
    ]);
  } else {
    await getDb().batch([updatePersonStmt(id, personData), ...maritalStmts]);
  }

  const updated = await getPersonWithHouseholdRowById(id);
  if (!updated) {
    throw new Error("Person not found");
  }

  return personWithHouseholdDbToApi(updated);
};
