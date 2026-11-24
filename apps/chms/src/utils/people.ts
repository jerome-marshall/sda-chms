import { MEMBERSHIP_STATUS } from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";

import type { Person } from "@/types/api";

function toOptional(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

export const personToForm = (person: Person): PersonInsertForm => ({
  firstName: person.firstName,
  lastName: toOptional(person.lastName),
  preferredName: toOptional(person.preferredName),
  gender: person.gender ?? ("" as PersonInsertForm["gender"]),
  dateOfBirth: person.dateOfBirth ?? "",
  photoUrl: toOptional(person.photoUrl),
  phone: toOptional(getInfoOrFromHousehold(person, "phone").data),
  email: toOptional(person.email),
  preferredVisitingTime: toOptional(
    getInfoOrFromHousehold(person, "preferredVisitingTime").data
  ),
  addressLine1: getInfoOrFromHousehold(person, "addressLine1").data ?? "",
  addressLine2: toOptional(getInfoOrFromHousehold(person, "addressLine2").data),
  city: getInfoOrFromHousehold(person, "city").data ?? "",
  state: getInfoOrFromHousehold(person, "state").data ?? "",
  country: getInfoOrFromHousehold(person, "country").data ?? "",
  membershipStatus: person.membershipStatus,
  dateJoinedChurch: toOptional(person.dateJoinedChurch),
  baptismDate: toOptional(person.baptismDate),
  baptismPlace: toOptional(person.baptismPlace),
  sabbathSchoolClass: person.sabbathSchoolClass ?? undefined,
  maritalStatus: person.maritalStatus,
  weddingDate: toOptional(person.weddingDate),
  occupation: toOptional(person.occupation),
  fathersName: toOptional(person.fathersName),
  mothersName: toOptional(person.mothersName),
  householdId: toOptional(person.householdId),
  familyName: toOptional(person.householdFamilyName),
  householdRole:
    person.householdRole ?? ("" as PersonInsertForm["householdRole"]),
  dietaryPreference: (person.dietaryPreference ??
    "none") as PersonInsertForm["dietaryPreference"],
  memorialDay: toOptional(person.memorialDay),
  visitationNotes: toOptional(person.visitationNotes),
  pastoralNotes: toOptional(person.pastoralNotes),
  importantDates: person.importantDates ?? [],
});

type HouseholdInfoKey =
  | "city"
  | "state"
  | "country"
  | "addressLine1"
  | "addressLine2"
  | "phone"
  | "preferredVisitingTime";

const HOUSEHOLD_FIELD: Record<HouseholdInfoKey, keyof Person> = {
  city: "householdCity",
  state: "householdState",
  country: "householdCountry",
  addressLine1: "householdAddressLine1",
  addressLine2: "householdAddressLine2",
  phone: "householdPhone",
  preferredVisitingTime: "householdPreferredVisitingTime",
};

export function getInfoOrFromHousehold(person: Person, key: HouseholdInfoKey) {
  if (person[key]) {
    return { data: person[key], isfromHousehold: false };
  }

  const householdValue = person[HOUSEHOLD_FIELD[key]] as
    | string
    | null
    | undefined;
  if (householdValue) {
    return { data: householdValue, isfromHousehold: true };
  }

  return { data: undefined, isfromHousehold: false };
}

export const personFormErrorMessage = (
  body: unknown,
  fallback: string
): string => {
  if (
    typeof body === "object" &&
    body !== null &&
    "constraint" in body &&
    body.constraint === "unique_person_identity"
  ) {
    return "A person with the same name and date of birth already exists";
  }
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String(body.message)
      : "";
  return message || fallback;
};

export const isDeceased = (person: Person) =>
  person.membershipStatus === "deceased";

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
      person.membershipStatus === MEMBERSHIP_STATUS.REGULAR_ATTENDEE
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
