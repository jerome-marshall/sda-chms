import type { PeopleInsertDb } from "@sda-chms/db/schema/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { toTitleCase } from "@sda-chms/shared/utils/helpers";

export const personApiToDb = (data: PersonInsertForm): PeopleInsertDb => {
  return {
    firstName: toTitleCase(data.firstName),
    lastName: toTitleCase(data.lastName),
    phone: data.phone,
    occupation: data.occupation,
    maritalStatus: data.maritalStatus,
    membershipStatus: data.membershipStatus,
    dietaryPreference: data.dietaryPreference,
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
    // householdId: data.householdId,
    householdRole: data.householdRole,
    sabbathSchoolClass: data.sabbathSchoolClass,
    pastoralNotes: data.pastoralNotes,
  };
};
