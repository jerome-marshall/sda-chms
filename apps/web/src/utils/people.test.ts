import { describe, expect, it } from "vitest";
import type { Person } from "@/types/api";
import { getInfoOrFromHousehold, isDeceased } from "./people";

/** The fields these utilities actually read — cast to Person for the call sites. */
interface PersonLike {
  householdPhone?: string | null;
  isHeadOfHousehold?: boolean;
  membershipStatus?: string;
  memorialDay?: string | null;
  phone?: string | null;
}
const asPerson = (person: PersonLike): Person => person as unknown as Person;

describe("isDeceased", () => {
  it("is true when membership status is deceased", () => {
    expect(isDeceased(asPerson({ membershipStatus: "deceased" }))).toBe(true);
  });

  it("is false for a living member even if a memorial day is set", () => {
    // Locks in the status-only rule from the merge resolution: the stale
    // `|| memorialDay !== null` form must stay discarded.
    expect(
      isDeceased(
        asPerson({ membershipStatus: "member", memorialDay: "2020-01-01" })
      )
    ).toBe(false);
  });
});

describe("getInfoOrFromHousehold", () => {
  it("uses the person's own value when present", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({ isHeadOfHousehold: false, phone: "12345" }),
      "phone"
    );
    expect(data).toBe("12345");
    expect(isfromHousehold).toBe(false);
  });

  it("falls back to the Household even for a head of household (ADR-0001)", () => {
    // The old head special-case is gone — a head inherits the household's
    // shared value like any other member when they have none of their own.
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: true,
        phone: null,
        householdPhone: "999",
      }),
      "phone"
    );
    expect(data).toBe("999");
    expect(isfromHousehold).toBe(true);
  });

  it("falls back to the Household when a person has no own value", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: false,
        phone: null,
        householdPhone: "999",
      }),
      "phone"
    );
    expect(data).toBe("999");
    expect(isfromHousehold).toBe(true);
  });

  it("treats an empty-string own value as absent and falls back", () => {
    // Documents the `||` behavior in the impl: any falsy own value (""/0), not
    // just null, is treated as "no value" and resolves to the household's.
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: false,
        phone: "",
        householdPhone: "999",
      }),
      "phone"
    );
    expect(data).toBe("999");
    expect(isfromHousehold).toBe(true);
  });

  it("returns nothing when a person has no own value and no household value", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({ isHeadOfHousehold: false, phone: null }),
      "phone"
    );
    expect(data).toBeUndefined();
    expect(isfromHousehold).toBe(false);
  });
});
