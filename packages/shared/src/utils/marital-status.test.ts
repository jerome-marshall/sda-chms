import { describe, expect, it } from "vitest";
import {
  effectiveMaritalStatus,
  maritalStatusFromSpouseState,
  resolveSpouseState,
  selectGoverningSpouseState,
} from "./marital-status";

const at = (iso: string) => new Date(iso);

describe("resolveSpouseState", () => {
  it("returns null when the link has no stored state", () => {
    expect(resolveSpouseState(null, false)).toBeNull();
  });

  it("keeps the stored state when the partner is alive", () => {
    expect(resolveSpouseState("married", false)).toBe("married");
    expect(resolveSpouseState("separated", false)).toBe("separated");
  });

  it("reads widowed when the partner is deceased and the marriage did not end in divorce", () => {
    expect(resolveSpouseState("married", true)).toBe("widowed");
    expect(resolveSpouseState("separated", true)).toBe("widowed");
    expect(resolveSpouseState("widowed", true)).toBe("widowed");
  });

  it("keeps divorced even when the partner is deceased", () => {
    expect(resolveSpouseState("divorced", true)).toBe("divorced");
  });
});

describe("selectGoverningSpouseState", () => {
  it("returns null when there are no spouse links", () => {
    expect(selectGoverningSpouseState([])).toBeNull();
  });

  it("prefers an ongoing marriage over a past one", () => {
    expect(
      selectGoverningSpouseState([
        {
          storedState: "divorced",
          partnerDeceased: false,
          createdAt: at("2020-01-01"),
        },
        {
          storedState: "married",
          partnerDeceased: false,
          createdAt: at("2024-06-01"),
        },
      ])
    ).toBe("married");
  });

  it("prefers separated over widowed or divorced", () => {
    expect(
      selectGoverningSpouseState([
        {
          storedState: "divorced",
          partnerDeceased: false,
          createdAt: at("2024-01-01"),
        },
        {
          storedState: "separated",
          partnerDeceased: false,
          createdAt: at("2020-01-01"),
        },
      ])
    ).toBe("separated");
  });

  it("picks the most recently created link when states tie (most recent married)", () => {
    expect(
      selectGoverningSpouseState([
        {
          storedState: "married",
          partnerDeceased: false,
          createdAt: at("2018-01-01"),
        },
        {
          storedState: "married",
          partnerDeceased: false,
          createdAt: at("2024-01-01"),
        },
      ])
    ).toBe("married");
  });

  it("derives widowhood before ranking, so a deceased partner outranks a divorced link", () => {
    expect(
      selectGoverningSpouseState([
        {
          storedState: "divorced",
          partnerDeceased: false,
          createdAt: at("2024-01-01"),
        },
        {
          storedState: "married",
          partnerDeceased: true,
          createdAt: at("2020-01-01"),
        },
      ])
    ).toBe("widowed");
  });
});

describe("effectiveMaritalStatus", () => {
  it("returns the stored value when no spouse link governs", () => {
    expect(effectiveMaritalStatus("single", [])).toBe("single");
    expect(effectiveMaritalStatus("divorced", [])).toBe("divorced");
  });

  it("follows the governing spouse link rather than the stored value", () => {
    expect(
      effectiveMaritalStatus("single", [
        {
          storedState: "married",
          partnerDeceased: false,
          createdAt: at("2024-01-01"),
        },
      ])
    ).toBe("married");
  });

  it("maps each spouse state onto the matching Marital Status", () => {
    expect(maritalStatusFromSpouseState("married")).toBe("married");
    expect(maritalStatusFromSpouseState("separated")).toBe("separated");
    expect(maritalStatusFromSpouseState("divorced")).toBe("divorced");
    expect(maritalStatusFromSpouseState("widowed")).toBe("widowed");
  });
});
