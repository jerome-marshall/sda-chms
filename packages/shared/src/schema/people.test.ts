import { describe, expect, it } from "vitest";
import { personInsertFormSchema } from "./people";

/** A valid head-of-household payload (heads don't need an existing household). */
const validHead = {
  firstName: "Jo",
  gender: "male",
  dateOfBirth: "1990-01-01",
  addressLine1: "123 Main St",
  city: "Hosur",
  state: "Tamil Nadu",
  country: "India",
  maritalStatus: "single",
  membershipStatus: "member",
  dietaryPreference: "none",
  householdRole: "head",
} as const;

describe("personInsertFormSchema", () => {
  it("accepts a short, two-letter first name (issue #1)", () => {
    expect(personInsertFormSchema.safeParse(validHead).success).toBe(true);
  });

  it("accepts a single-character first name", () => {
    const result = personInsertFormSchema.safeParse({
      ...validHead,
      firstName: "A",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty first name", () => {
    const result = personInsertFormSchema.safeParse({
      ...validHead,
      firstName: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows an omitted last name", () => {
    expect("lastName" in validHead).toBe(false);
    expect(personInsertFormSchema.safeParse(validHead).success).toBe(true);
  });

  it("requires a household for a non-head member", () => {
    const result = personInsertFormSchema.safeParse({
      ...validHead,
      householdRole: "child",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a non-head member when a householdId is supplied", () => {
    const result = personInsertFormSchema.safeParse({
      ...validHead,
      householdRole: "child",
      householdId: "11111111-1111-1111-1111-111111111111",
    });
    expect(result.success).toBe(true);
  });
});
