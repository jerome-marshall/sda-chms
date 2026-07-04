import { describe, expect, it } from "vitest";
import {
  getReciprocalRelationshipType,
  RELATIONSHIP_TYPE_VALUES,
} from "../constants/people";
import { relationshipCreateSchema } from "./people";

describe("relationship reciprocity (ADR-0003)", () => {
  it("defines a reciprocal for every relationship type", () => {
    for (const type of RELATIONSHIP_TYPE_VALUES) {
      expect(RELATIONSHIP_TYPE_VALUES).toContain(
        getReciprocalRelationshipType(type)
      );
    }
  });

  it("is its own inverse (reciprocal of the reciprocal is the original)", () => {
    for (const type of RELATIONSHIP_TYPE_VALUES) {
      const back = getReciprocalRelationshipType(
        getReciprocalRelationshipType(type)
      );
      expect(back).toBe(type);
    }
  });

  it("flips parent ⇄ child and grandparent ⇄ grandchild", () => {
    expect(getReciprocalRelationshipType("parent")).toBe("child");
    expect(getReciprocalRelationshipType("child")).toBe("parent");
    expect(getReciprocalRelationshipType("grandparent")).toBe("grandchild");
    expect(getReciprocalRelationshipType("grandchild")).toBe("grandparent");
    expect(getReciprocalRelationshipType("step_parent")).toBe("step_child");
  });

  it("keeps symmetric types unchanged", () => {
    expect(getReciprocalRelationshipType("spouse")).toBe("spouse");
    expect(getReciprocalRelationshipType("sibling")).toBe("sibling");
    expect(getReciprocalRelationshipType("half_sibling")).toBe("half_sibling");
    expect(getReciprocalRelationshipType("other")).toBe("other");
  });
});

describe("relationshipCreateSchema", () => {
  const valid = {
    personId: "11111111-1111-1111-1111-111111111111",
    relatedPersonId: "22222222-2222-2222-2222-222222222222",
    type: "parent",
  } as const;

  it("accepts a link between two distinct people", () => {
    expect(relationshipCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects linking a person to themselves", () => {
    const result = relationshipCreateSchema.safeParse({
      ...valid,
      relatedPersonId: valid.personId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown relationship type", () => {
    const result = relationshipCreateSchema.safeParse({
      ...valid,
      type: "cousin",
    });
    expect(result.success).toBe(false);
  });
});
