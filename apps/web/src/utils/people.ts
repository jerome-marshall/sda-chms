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
  // Contact
  phone: toOptional(person.phone),
  email: toOptional(person.email),
  preferredVisitingTime: toOptional(person.preferredVisitingTime),
  // Address
  addressLine1: person.addressLine1 ?? "",
  addressLine2: toOptional(person.addressLine2),
  city: person.city ?? "",
  state: person.state ?? "",
  country: person.country ?? "",
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
  householdId: toOptional(person.householdId),
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

/** Contact fields eligible for head-of-household fallback. */
type HouseholdInfoKey =
  | "city"
  | "state"
  | "country"
  | "addressLine1"
  | "addressLine2"
  | "phone"
  | "preferredVisitingTime";

type PersonWithHouseholdHead = Person & {
  householdHead: Partial<Record<HouseholdInfoKey, string | null | undefined>>;
};

/** Type guard: checks whether the person record includes household head data for fallback. */
const hasHouseholdHead = (
  person: Person
): person is PersonWithHouseholdHead => {
  return (
    "householdHead" in person &&
    typeof person.householdHead === "object" &&
    person.householdHead !== null
  );
};

/**
 * Returns a contact field for a person, falling back to the household head's
 * value when the person has none. Heads never fall back.
 */
export function getInfoOrFromHousehold(person: Person, key: HouseholdInfoKey) {
  // Heads always use their own info; non-heads use theirs if available
  if (person.isHeadOfHousehold || person[key]) {
    return { data: person[key], isfromHousehold: false };
  }

  // No household head attached — nothing to fall back to
  if (!hasHouseholdHead(person)) {
    return { data: undefined, isfromHousehold: false };
  }

  // Fall back to the head's value
  return { data: person.householdHead[key], isfromHousehold: true };
}

/** A person is deceased if explicitly marked or has a memorial day recorded. */
export const isDeceased = (person: Person) => {
  return person.membershipStatus === "deceased" || person.memorialDay !== null;
};

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
