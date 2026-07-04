import {
  RELATIONSHIP_TYPE,
  SPOUSE_STATE,
  type SPOUSE_STATE_VALUES,
} from "@sda-chms/shared/constants/people";
import type { RelationshipCreate } from "@sda-chms/shared/schema/people";
import {
  deleteRelationship,
  getRelationshipsForPerson,
  insertRelationship,
  updateRelationshipState,
} from "../data-access/relationships";
import { relationshipsDbToApi } from "../transformers/relationships";

/**
 * Creates a relationship link between two people. A spouse link carries a
 * lifecycle state (ADR-0003) — defaulting to `married` when none is supplied;
 * every other type stores no state.
 */
export const addRelationshipUseCase = async (data: RelationshipCreate) => {
  const state =
    data.type === RELATIONSHIP_TYPE.SPOUSE
      ? (data.state ?? SPOUSE_STATE.MARRIED)
      : null;
  const created = await insertRelationship({ ...data, state });
  if (!created) {
    throw new Error("Failed to create relationship");
  }
  return created;
};

/**
 * Changes a spouse link's lifecycle state (e.g. married → divorced). The link
 * persists through the change — a divorce/death is a state, not a deletion.
 */
export const updateRelationshipStateUseCase = async (
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number]
) => {
  const updated = await updateRelationshipState(id, state);
  if (!updated) {
    throw new Error("Relationship not found");
  }
  return updated;
};

/** Returns a person's relationships, each resolved from that person's perspective. */
export const getPersonRelationshipsUseCase = async (personId: string) => {
  const rows = await getRelationshipsForPerson(personId);
  return relationshipsDbToApi(rows, personId);
};

/** Removes a relationship link by id. */
export const removeRelationshipUseCase = async (id: string) => {
  const deleted = await deleteRelationship(id);
  if (!deleted) {
    throw new Error("Relationship not found");
  }
  return { id: deleted.id };
};
