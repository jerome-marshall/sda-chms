import { describe, expect, it } from "vite-plus/test";

import { SABBATH_SCHOOL_CLASS } from "../constants/people";
import { getSabbathSchoolClass } from "./sabbath-school";

// A fixed reference date. Birthdays on January 1 have already passed by
// January 6, so each assertion lands exactly on the intended age without a
// timezone or day-shift edge.
const REFERENCE_DATE = new Date(2026, 0, 6);

const dobForAge = (age: number) =>
  new Date(REFERENCE_DATE.getFullYear() - age, 0, 1);

describe(getSabbathSchoolClass, () => {
  it.each([
    [0, SABBATH_SCHOOL_CLASS.BEGINNER],
    [3, SABBATH_SCHOOL_CLASS.BEGINNER],
    [4, SABBATH_SCHOOL_CLASS.KINDERGARTEN],
    [5, SABBATH_SCHOOL_CLASS.KINDERGARTEN],
    [6, SABBATH_SCHOOL_CLASS.PRIMARY],
    [8, SABBATH_SCHOOL_CLASS.PRIMARY],
    [9, SABBATH_SCHOOL_CLASS.JUNIOR],
    [11, SABBATH_SCHOOL_CLASS.JUNIOR],
    [12, SABBATH_SCHOOL_CLASS.EARLITEEN],
    [13, SABBATH_SCHOOL_CLASS.EARLITEEN],
    [14, SABBATH_SCHOOL_CLASS.YOUTH],
    [18, SABBATH_SCHOOL_CLASS.YOUTH],
    [19, SABBATH_SCHOOL_CLASS.YOUNG_ADULT],
    [30, SABBATH_SCHOOL_CLASS.YOUNG_ADULT],
    [31, SABBATH_SCHOOL_CLASS.ADULT],
  ])("assigns age %i to %s", (age, expected) => {
    expect(getSabbathSchoolClass(dobForAge(age), REFERENCE_DATE)).toBe(
      expected
    );
  });
});
