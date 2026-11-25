// @vitest-environment jsdom
import { describe, expect, it } from "vite-plus/test";

import type { Person } from "@/types/api";

import { getInfoOrFromHousehold, isDeceased } from "./people";

interface PersonLike {
  householdPhone?: string | null;
  isHeadOfHousehold?: boolean;
  membershipStatus?: string;
  memorialDay?: string | null;
  phone?: string | null;
}
const asPerson = (person: PersonLike): Person => person as Person;

describe(isDeceased, () => {
  it("is true when membership status is deceased", () => {
    expect(isDeceased(asPerson({ membershipStatus: "deceased" }))).toBe(true);
  });

  it("is false for a living member even if a memorial day is set", () => {
    expect(
      isDeceased(
        asPerson({ membershipStatus: "member", memorialDay: "2020-01-01" })
      )
    ).toBe(false);
  });
});

describe(getInfoOrFromHousehold, () => {
  it("uses the person's own value when present", () => {
    const { data, isfromHousehold } = getInfoOrFromHousehold(
      asPerson({ isHeadOfHousehold: false, phone: "12345" }),
      "phone"
    );
    expect(data).toBe("12345");
    expect(isfromHousehold).toBe(false);
  });

  it("falls back to the Household even for a head of household (ADR-0001)", () => {
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

  it("treats an empty-string own value as absent and falls back", () => {
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
