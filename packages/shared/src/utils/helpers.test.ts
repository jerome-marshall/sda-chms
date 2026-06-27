import { describe, expect, it } from "vitest";
import { calculateAge, toDate, toDateString, toTitleCase } from "./helpers";

describe("toTitleCase", () => {
  it("capitalizes each word", () => {
    expect(toTitleCase("mary jane")).toBe("Mary Jane");
  });

  it("handles hyphenated names", () => {
    expect(toTitleCase("jean-pierre")).toBe("Jean-Pierre");
  });

  it("trims surrounding whitespace and lowercases the remainder", () => {
    expect(toTitleCase("  JOHN  ")).toBe("John");
  });
});

describe("toDate", () => {
  it("returns undefined for empty or invalid input", () => {
    expect(toDate("")).toBeUndefined();
    expect(toDate(null)).toBeUndefined();
    expect(toDate("not-a-date")).toBeUndefined();
  });

  it("parses an ISO date string into a Date", () => {
    expect(toDate("2026-01-06")).toBeInstanceOf(Date);
  });

  it("passes through an existing Date", () => {
    const d = new Date(2026, 0, 6);
    expect(toDate(d)).toBe(d);
  });
});

describe("toDateString", () => {
  it("formats a Date as YYYY-MM-DD in local time", () => {
    expect(toDateString(new Date(2026, 0, 6))).toBe("2026-01-06");
  });

  it("returns undefined for nullish input", () => {
    expect(toDateString(null)).toBeUndefined();
  });
});

describe("calculateAge", () => {
  it("computes whole years from a date of birth", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    dob.setDate(dob.getDate() - 1); // ensure the birthday has already passed
    expect(calculateAge(dob)).toBe(30);
  });

  it("returns undefined when the date of birth is missing", () => {
    expect(calculateAge(undefined)).toBeUndefined();
  });
});
