import z from "zod";
import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  HOUSEHOLD_ROLE_VALUES,
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
  SABBATH_SCHOOL_CLASS_VALUES,
} from "../constants/people";

const errorMessages = {
  firstName: "First name is missing",
  lastName: "Last name is missing",
  preferredName: "Preferred name is missing",
  gender: "Pick a gender",
  dateOfBirth: "Date of birth is missing",
  photoUrl: "Photo URL is missing",
  phone: "Phone number is missing",
  state: "State is missing",
  country: "Country is missing",
  occupation: "Occupation is missing",
  maritalStatus: "Pick a marital status",
  membershipStatus: "Pick a membership status",
  dietaryPreference: "Pick a dietary preference",
  householdRole: "Household role is missing",
  sabbathSchoolClass: "Pick a Sabbath School class",
  visitationNotes: "Visitation notes are missing",
  pastoralNotes: "Pastoral notes are missing",
  addressLine1: "Address is missing",
  city: "City is missing",
};

export const personInsertFormSchema = z
  .object({
    firstName: z
      .string({ error: errorMessages.firstName })
      .min(3, { error: errorMessages.firstName }),
    lastName: z
      .string({ error: errorMessages.lastName })
      .min(1, { error: errorMessages.lastName }),
    preferredName: z.string().optional(),
    gender: z.enum(GENDER_VALUES, { error: errorMessages.gender }),
    dateOfBirth: z.string({ message: errorMessages.dateOfBirth }),
    photoUrl: z.url().optional(),
    phone: z
      .string({ error: errorMessages.phone })
      .min(10, { error: errorMessages.phone }),
    email: z.email().optional(),
    addressLine1: z
      .string({ error: errorMessages.addressLine1 })
      .min(3, { error: errorMessages.addressLine1 }),
    addressLine2: z.string().optional(),
    city: z
      .string({ error: errorMessages.city })
      .min(1, { error: errorMessages.city }),
    state: z
      .string({ error: errorMessages.state })
      .min(1, { error: errorMessages.state }),
    country: z
      .string({ error: errorMessages.country })
      .min(1, { error: errorMessages.country }),
    occupation: z
      .string({ error: errorMessages.occupation })
      .min(1, { error: errorMessages.occupation }),
    maritalStatus: z.enum(MARITAL_STATUS_VALUES, {
      error: errorMessages.maritalStatus,
    }),
    weddingDate: z.string().optional(),
    memorialDay: z.string().optional(),
    baptismDate: z.string().optional(),
    baptismPlace: z.string().optional(),
    membershipStatus: z.enum(MEMBERSHIP_STATUS_VALUES, {
      error: errorMessages.membershipStatus,
    }),
    dateJoinedChurch: z.string().optional(),
    dietaryPreference: z.enum(DIETARY_PREFERENCES_VALUES, {
      error: errorMessages.dietaryPreference,
    }),
    preferredVisitingTime: z.string().optional(),
    householdId: z.string().optional(),
    householdRole: z.enum(HOUSEHOLD_ROLE_VALUES, {
      error: errorMessages.householdRole,
    }),
    // groupIds: z.string().array().optional(),
    sabbathSchoolClass: z.enum(SABBATH_SCHOOL_CLASS_VALUES, {
      error: errorMessages.sabbathSchoolClass,
    }),
    visitationNotes: z.string().optional(),
    pastoralNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Valid if: role is "head" (doesn't need existing household) OR householdId is provided
      return data.householdRole === "head" || !!data.householdId;
    },
    {
      message: "Household is required for non-head of household",
      path: ["householdId"],
    }
  );
export type PersonInsertForm = z.infer<typeof personInsertFormSchema>;
