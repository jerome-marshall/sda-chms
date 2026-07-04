import type {
  PeopleInsertDb,
  PeopleSelectDb,
} from "@sda-chms/db/schema/people";
import type {
  PersonInsertForm,
  PersonUpdateForm,
} from "@sda-chms/shared/schema/people";
import { calculateAge, toTitleCase } from "@sda-chms/shared/utils/helpers";
import type { getAllPeopleWithHousehold } from "../data-access/people";

// Inferred from the data-access return type so it stays in sync with the query
type PersonWithHouseholdDb = Awaited<
  ReturnType<typeof getAllPeopleWithHousehold>
>[number];

/** Shared field mapping used by both insert and update transformers. */
const personFormToDbFields = (
  data: PersonInsertForm | PersonUpdateForm
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

/** Adds computed fields (fullName, age) to a DB person record for the API response. */
export const personDbToApi = (personData: PeopleSelectDb) => ({
  ...personData,
  fullName: `${personData.firstName} ${personData.lastName ?? ""}`.trim(),
  age: calculateAge(personData.dateOfBirth),
});

/**
 * Transforms a person + their Household DB record into the API shape (ADR-0001).
 * Surfaces the Household's shared contact fields (`household*`) alongside the
 * person's own so every reader can resolve the effective value — the person's
 * own if set, otherwise the Household's. No head-of-household fallback remains.
 */
export const personWithHouseholdDbToApi = (
  personData: PersonWithHouseholdDb
) => {
  const { household, ...personDataWithoutHousehold } = personData;
  return {
    ...personDataWithoutHousehold,
    fullName: `${personData.firstName} ${personData.lastName ?? ""}`.trim(),
    age: calculateAge(personData.dateOfBirth),
    isHeadOfHousehold: personData.householdRole === "head",
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

/** Batch-transforms a list of person + household records for the people list API. */
export const peopleWithHouseholdDbToApi = (data: PersonWithHouseholdDb[]) =>
  data.map(personWithHouseholdDbToApi);

/** The shared contact fields the Household owns; pulled off a person form to store on the Household. */
export const householdContactFromForm = (
  data: PersonInsertForm | PersonUpdateForm
) => ({
  addressLine1: data.addressLine1 || null,
  addressLine2: data.addressLine2 || null,
  city: data.city || null,
  state: data.state || null,
  country: data.country || null,
  phone: data.phone || null,
  preferredVisitingTime: data.preferredVisitingTime || null,
});

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

/** Maps the client-submitted update form data to the DB shape without overriding isActive. */
export const personUpdateApiToDb = (
  data: PersonUpdateForm
): Omit<PeopleInsertDb, "isActive"> => personFormToDbFields(data);
