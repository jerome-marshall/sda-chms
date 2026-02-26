import type { Person } from "@/types/api";

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
const isDeceased = (person: Person) => {
  return person.membershipStatus === "deceased" || person.memorialDay !== null;
};

/** Computes dashboard stats from a people list, excluding deceased members. */
export const getPeopleStats = (people: Person[]) => {
  const peopleAlive = people.filter((person) => !isDeceased(person));
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
  };
};
