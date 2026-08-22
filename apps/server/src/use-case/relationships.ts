import { createTransaction } from "@sda-chms/db";
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
import { syncMaritalStatusForPeople } from "./marital-status";

/**
 * Creates a relationship link between two people. A spouse link carries a
 * lifecycle state (ADR-0003) — defaulting to `married` when none is supplied;
 * every other type stores no state. Creating a spouse link updates both
 * People's Marital Status to follow the governing link (issue #8).
 */
export const addRelationshipUseCase = async (data: RelationshipCreate) => {
  const state =
    data.type === RELATIONSHIP_TYPE.SPOUSE
      ? (data.state ?? SPOUSE_STATE.MARRIED)
      : null;

  return await createTransaction(async (trx) => {
    const created = await insertRelationship({ ...data, state }, trx);
    if (!created) {
      throw new Error("Failed to create relationship");
    }
    if (data.type === RELATIONSHIP_TYPE.SPOUSE) {
      await syncMaritalStatusForPeople(
        [data.personId, data.relatedPersonId],
        trx
      );
    }
    return created;
  });
};

/**
 * Changes a spouse link's lifecycle state (e.g. married → divorced). The link
 * persists through the change — a divorce/death is a state, not a deletion —
 * and both People's Marital Status follow the new governing state (issue #8).
 */
export const updateRelationshipStateUseCase = async (
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number]
) =>
  await createTransaction(async (trx) => {
    const updated = await updateRelationshipState(id, state, trx);
    if (!updated) {
      throw new Error("Relationship not found");
    }
    if (updated.type === RELATIONSHIP_TYPE.SPOUSE) {
      await syncMaritalStatusForPeople(
        [updated.personId, updated.relatedPersonId],
        trx
      );
    }
    return updated;
  });

/** Returns a person's relationships, each resolved from that person's perspective. */
export const getPersonRelationshipsUseCase = async (personId: string) => {
  const rows = await getRelationshipsForPerson(personId);
  return relationshipsDbToApi(rows, personId);
};

/**
 * Removes a relationship link by id. Removing a spouse link re-evaluates both
 * People's Marital Status from any remaining spouse links (issue #8).
 */
export const removeRelationshipUseCase = async (id: string) =>
  await createTransaction(async (trx) => {
    const deleted = await deleteRelationship(id, trx);
    if (!deleted) {
      throw new Error("Relationship not found");
    }
    if (deleted.type === RELATIONSHIP_TYPE.SPOUSE) {
      await syncMaritalStatusForPeople(
        [deleted.personId, deleted.relatedPersonId],
        trx
      );
    }
    return { id: deleted.id };
  });
