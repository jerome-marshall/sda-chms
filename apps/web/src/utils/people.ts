import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import type { Person, PersonDetail } from "@/types/api";

/** Converts nullable DB strings to optional form strings. */
function toOptional(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

/** Maps a PersonDetail API response to the form shape used by Add/Edit person forms. */
export const personDetailToForm = (person: PersonDetail): PersonInsertForm => ({
  // Personal
  firstName: person.firstName,
  lastName: toOptional(person.lastName),
  preferredName: toOptional(person.preferredName),
  gender: person.gender ?? ("" as PersonInsertForm["gender"]),
  dateOfBirth: person.dateOfBirth ?? "",
  photoUrl: toOptional(person.photoUrl),
  // Contact — prefill with the effective value (own, else the Household's) so
  // editing a Head shows the shared details and saving doesn't wipe them.
  phone: toOptional(person.phone ?? person.householdPhone),
  email: toOptional(person.email),
  preferredVisitingTime: toOptional(
    person.preferredVisitingTime ?? person.householdPreferredVisitingTime
  ),
  // Address
  addressLine1: person.addressLine1 ?? person.householdAddressLine1 ?? "",
  addressLine2: toOptional(person.addressLine2 ?? person.householdAddressLine2),
  city: person.city ?? person.householdCity ?? "",
  state: person.state ?? person.householdState ?? "",
  country: person.country ?? person.householdCountry ?? "",
  // Church membership
  membershipStatus: person.membershipStatus,
  dateJoinedChurch: toOptional(person.dateJoinedChurch),
  baptismDate: toOptional(person.baptismDate),
  baptismPlace: toOptional(person.baptismPlace),
  sabbathSchoolClass: person.sabbathSchoolClass ?? undefined,
  // Family & household
  maritalStatus: person.maritalStatus,
  weddingDate: toOptional(person.weddingDate),
  occupation: toOptional(person.occupation),
  fathersName: toOptional(person.fathersName),
  mothersName: toOptional(person.mothersName),
  householdId: toOptional(person.householdId),
  familyName: toOptional(person.householdFamilyName),
  householdRole:
    person.householdRole ?? ("" as PersonInsertForm["householdRole"]),
  // Preferences
  dietaryPreference: (person.dietaryPreference ??
    "none") as PersonInsertForm["dietaryPreference"],
  // Notes
  memorialDay: toOptional(person.memorialDay),
  visitationNotes: toOptional(person.visitationNotes),
  pastoralNotes: toOptional(person.pastoralNotes),
  importantDates: person.importantDates ?? [],
});

/** Shared contact fields a Person inherits from their Household unless overridden (ADR-0001). */
type HouseholdInfoKey =
  | "city"
  | "state"
  | "country"
  | "addressLine1"
  | "addressLine2"
  | "phone"
  | "preferredVisitingTime";

/** Maps a person's own contact field to the matching `household*` field on the API record. */
const HOUSEHOLD_FIELD: Record<HouseholdInfoKey, keyof Person> = {
  city: "householdCity",
  state: "householdState",
  country: "householdCountry",
  addressLine1: "householdAddressLine1",
  addressLine2: "householdAddressLine2",
  phone: "householdPhone",
  preferredVisitingTime: "householdPreferredVisitingTime",
};

/**
 * Resolves a Person's effective value for a shared contact field: their own if
 * set, otherwise the Household's (ADR-0001). No head special-casing — a head
 * inherits from their Household like any other member.
 */
export function getInfoOrFromHousehold(person: Person, key: HouseholdInfoKey) {
  // The person's own value overrides the household default.
  if (person[key]) {
    return { data: person[key], isfromHousehold: false };
  }

  // Fall back to the Household's shared value when the person has none.
  const householdValue = person[HOUSEHOLD_FIELD[key]] as
    | string
    | null
    | undefined;
  if (householdValue) {
    return { data: householdValue, isfromHousehold: true };
  }

  return { data: undefined, isfromHousehold: false };
}

/** A person is deceased when their membership status says so. */
export const isDeceased = (person: Person) =>
  person.membershipStatus === "deceased";

/** Computes dashboard stats from a people list, excluding deceased members. */
export const getPeopleStats = (people: Person[]) => {
  const peopleAlive = people.filter((person) => !isDeceased(person));
  const totalMembers = peopleAlive.length;
  const totalBaptized = peopleAlive.filter(
    (person) => person.baptismDate
  ).length;
  const totalUnbaptized = totalMembers - totalBaptized;
  const totalActiveMembers = peopleAlive.filter(
    (person) =>
      person.membershipStatus === "member" ||
      person.membershipStatus === "regular_attendee"
  ).length;
  const totalInactiveMembers = peopleAlive.filter(
    (person) =>
      person.membershipStatus === "inactive" ||
      person.membershipStatus === "moved"
  ).length;
  // ~90 days approximation for "this quarter"
  const totalNewMembers = peopleAlive.filter(
    (person) =>
      person.dateJoinedChurch &&
      new Date(person.dateJoinedChurch) >
        new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    totalPeople: peopleAlive.length,
    totalActiveMembers,
    totalInactiveMembers,
    totalNewMembers,
    totalBaptized,
    totalUnbaptized,
  };
};
