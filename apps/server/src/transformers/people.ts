import type {
  PeopleInsertDb,
  PeopleSelectDb,
} from "@sda-chms/db/schema/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { calculateAge, toTitleCase } from "@sda-chms/shared/utils/helpers";
import type { getAllPeopleWithHead } from "../data-access/people";

// Inferred from the data-access return type so it stays in sync with the query
type PersonWithHouseholdHeadDb = Awaited<
  ReturnType<typeof getAllPeopleWithHead>
>[number];

/** Maps the client-submitted form data to the DB insert shape, title-casing names before storage. */
export const personApiToDb = (data: PersonInsertForm): PeopleInsertDb => {
  return {
    firstName: toTitleCase(data.firstName),
    lastName: data.lastName ? toTitleCase(data.lastName) : data.lastName,
    phone: data.phone,
    occupation: data.occupation,
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
    isActive: true,
    dateOfBirth: data.dateOfBirth,
    email: data.email,
    photoUrl: data.photoUrl,
    gender: data.gender,
    preferredName: data.preferredName,
    householdId: data.householdId,
    householdRole: data.householdRole,
    sabbathSchoolClass: data.sabbathSchoolClass,
    pastoralNotes: data.pastoralNotes,
  };
};

/** Adds computed fields (fullName, age) to a DB person record for the API response. */
export const personDbToApi = (personData: PeopleSelectDb) => {
  return {
    ...personData,
    fullName: `${personData.firstName} ${personData.lastName ?? ""}`.trim(),
    age: calculateAge(personData.dateOfBirth),
  };
};

/**
 * Transforms a person + household head DB record into the API shape.
 * Applies the head-of-household fallback: non-heads get the head's contact
 * fields so the UI can display them when the member has none of their own.
 */
export const personWithHeadDbToApi = (
  personData: PersonWithHouseholdHeadDb
) => {
  const { household, ...personDataWithoutHousehold } = personData;
  const head = household?.members[0];
  const personBase = {
    ...personDataWithoutHousehold,
    fullName: `${personData.firstName} ${personData.lastName ?? ""}`.trim(),
    age: calculateAge(personData.dateOfBirth),
  };

  // No head found (data integrity gap) — no fallback fields available
  if (!head) {
    return {
      ...personBase,
      isHeadOfHousehold: personData.householdRole === "head",
      household: undefined,
    } as const;
  }

  // Person is the head — no fallback needed, they always show their own info
  if (personData.id === head.id) {
    return {
      ...personBase,
      isHeadOfHousehold: true as const,
      household: undefined,
    } as const;
  }

  // Non-head member — include the head's contact fields for UI fallback
  return {
    ...personBase,
    isHeadOfHousehold: false as const,
    householdHead: head,
    householdAddressLine1: head.addressLine1,
    householdAddressLine2: head.addressLine2,
    householdCity: head.city,
    householdState: head.state,
    householdCountry: head.country,
    householdPreferredVisitingTime: head.preferredVisitingTime,
    householdPhone: head.phone,
    household: undefined, // strip the raw join from the API response
  };
};

/** Batch-transforms a list of person + household head records for the people list API. */
export const peopleWithHeadDbToApi = (data: PersonWithHouseholdHeadDb[]) => {
  return data.map(personWithHeadDbToApi);
};
