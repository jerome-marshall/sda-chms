import {
  SABBATH_SCHOOL_CLASS,
  SABBATH_SCHOOL_CLASS_OPTIONS,
} from "../constants/people";
import { calculateAge } from "./helpers";

type SabbathSchoolClass =
  (typeof SABBATH_SCHOOL_CLASS)[keyof typeof SABBATH_SCHOOL_CLASS];

/**
 * Maps a date of birth to its Sabbath School class, derived from the canonical
 * age bands in {@link SABBATH_SCHOOL_CLASS_OPTIONS} so callers never drift from
 * the single source of truth. Pass an explicit `referenceDate` for deterministic
 * results (e.g. seeding); defaults to now for live use.
 */
export const getSabbathSchoolClass = (
  dateOfBirth: Date | string,
  referenceDate: Date = new Date()
): SabbathSchoolClass => {
  const age = calculateAge(dateOfBirth, referenceDate) ?? Number.NaN;

  const match = SABBATH_SCHOOL_CLASS_OPTIONS.find(
    (option) => age >= option.minAge && age <= option.maxAge
  );

  return (match?.value ?? SABBATH_SCHOOL_CLASS.ADULT) as SabbathSchoolClass;
};
