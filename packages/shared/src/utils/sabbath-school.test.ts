import { describe, expect, it } from "vitest";
import { SABBATH_SCHOOL_CLASS } from "../constants/people";
import { getSabbathSchoolClass } from "./sabbath-school";

// A fixed, local-time reference date. Building it from numeric parts (not an ISO
// string, which would parse as UTC) keeps it in the same timezone the date
// accessors read, so these assertions never shift by a day across timezones.
const REFERENCE_DATE = new Date(2026, 0, 6);

// Mid-year birthdays keep each assertion a comfortable distance from an age-band
// edge, so a ±1 day shift can never cross a boundary.
const dobInYear = (year: number) => new Date(year, 5, 15);

describe("getSabbathSchoolClass", () => {
  it("assigns beginner to an infant", () => {
    expect(getSabbathSchoolClass(dobInYear(2024), REFERENCE_DATE)).toBe(
      SABBATH_SCHOOL_CLASS.BEGINNER
    );
  });

  it("assigns earliteen to a 12-year-old", () => {
    expect(getSabbathSchoolClass(dobInYear(2013), REFERENCE_DATE)).toBe(
      SABBATH_SCHOOL_CLASS.EARLITEEN
    );
  });

  it("assigns young_adult to a 25-year-old", () => {
    expect(getSabbathSchoolClass(dobInYear(2000), REFERENCE_DATE)).toBe(
      SABBATH_SCHOOL_CLASS.YOUNG_ADULT
    );
  });

  it("assigns adult to a 45-year-old", () => {
    expect(getSabbathSchoolClass(dobInYear(1980), REFERENCE_DATE)).toBe(
      SABBATH_SCHOOL_CLASS.ADULT
    );
  });
});
