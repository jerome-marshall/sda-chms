import z from "zod";
import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  HOUSEHOLD_ROLE_VALUES,
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
  RELATIONSHIP_TYPE_VALUES,
} from "../constants/people";

export const personInsertFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string(),
  preferredName: z.string().optional(),
  gender: z.enum(GENDER_VALUES),
  dateOfBirth: z.date(),
  photoUrl: z.url().optional(),
  phone: z.string().min(1),
  email: z.email().optional(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  occupation: z.string().min(1),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES),
  weddingDate: z.date().optional(),
  memorialDay: z.date().optional(),
  baptismDate: z.date().optional(),
  baptismPlace: z.string().optional(),
  membershipStatus: z.enum(MEMBERSHIP_STATUS_VALUES),
  dateJoinedChurch: z.date().optional(),
  dietaryPreference: z.enum(DIETARY_PREFERENCES_VALUES),
  householdRole: z.enum(HOUSEHOLD_ROLE_VALUES),
  relationships: z
    .array(
      z.object({
        relatedPersonId: z.string(),
        relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
        notes: z.string(),
      })
    )
    .optional(),
  groupIds: z.string().array().optional(),
  sabbathSchoolClassId: z.string().min(1),
  visitationNotes: z.string().optional(),
  pastoralNotes: z.string().optional(),
});
export type PersonInsertForm = z.infer<typeof personInsertFormSchema>;
