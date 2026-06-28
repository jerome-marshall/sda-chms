import type { RelationshipCreate } from "@sda-chms/shared/schema/people";
import {
  deleteRelationship,
  getRelationshipsForPerson,
  insertRelationship,
} from "../data-access/relationships";
import { relationshipsDbToApi } from "../transformers/relationships";

/** Creates a relationship link between two people. */
export const addRelationshipUseCase = async (data: RelationshipCreate) => {
  const created = await insertRelationship(data);
  if (!created) {
    throw new Error("Failed to create relationship");
  }
  return created;
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
