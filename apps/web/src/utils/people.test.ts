import { describe, expect, it } from "vitest";
import type { Person } from "@/types/api";
import { getInfoOrFromHousehold, isDeceased } from "./people";

/** The fields these utilities actually read — cast to Person for the call sites. */
interface PersonLike {
  householdHead?: { phone?: string | null } | null;
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

  it("never falls back to the household for a head of household", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: true,
        phone: null,
        householdHead: { phone: "999" },
      }),
      "phone"
    );
    expect(data).toBeNull();
    expect(isfromHousehold).toBe(false);
  });

  it("falls back to the household head when a non-head has no own value", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: false,
        phone: null,
        householdHead: { phone: "999" },
      }),
      "phone"
    );
    expect(data).toBe("999");
    expect(isfromHousehold).toBe(true);
  });

  it("treats a non-head's empty-string own value as absent and falls back", () => {
    // Documents the `||` behavior in the impl: any falsy own value (""/0), not
    // just null, is treated as "no value" and resolves to the household head's.
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({
        isHeadOfHousehold: false,
        phone: "",
        householdHead: { phone: "999" },
      }),
      "phone"
    );
    expect(data).toBe("999");
    expect(isfromHousehold).toBe(true);
  });

  it("returns nothing when a non-head has no own value and no household head", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({ isHeadOfHousehold: false, phone: null }),
      "phone"
    );
    expect(data).toBeUndefined();
    expect(isfromHousehold).toBe(false);
  });
});
