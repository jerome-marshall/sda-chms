import { type DbTransaction, eq, getDb } from "@sda-chms/db";
import {
  type RelationshipsInsertDb,
  relationshipsTable,
} from "@sda-chms/db/schema/people";
import {
  RELATIONSHIP_TYPE,
  type SPOUSE_STATE_VALUES,
} from "@sda-chms/shared/constants/people";
import { withDbErrorHandling } from "../lib/errors";

/**
 * The person columns surfaced for each side of a relationship. `membershipStatus`
 * lets the transformer reflect widowhood when a spouse's partner is deceased.
 */
const relatedPersonColumns = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  membershipStatus: true,
} as const;

/** Inserts a relationship row (one direction; the reciprocal is derived on read). */
export const insertRelationship = (
  data: RelationshipsInsertDb,
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const rows = await trx.insert(relationshipsTable).values(data).returning();
    return rows[0];
  }, "insertRelationship");

/**
 * Fetches every relationship touching a person — both the rows where they are the
 * subject (`person`) and the rows where they are the object (`relatedPerson`) —
 * each with the joined person on both sides so the use-case can resolve the link
 * from this person's perspective.
 */
export const getRelationshipsForPerson = (personId: string) =>
  withDbErrorHandling(async () => {
    const rows = await getDb().query.relationshipsTable.findMany({
      where: (table, { or, eq: eqOp }) =>
        or(
          eqOp(table.personId, personId),
          eqOp(table.relatedPersonId, personId)
        ),
      with: {
        person: { columns: relatedPersonColumns },
        relatedPerson: { columns: relatedPersonColumns },
      },
    });
    return rows;
  }, "getRelationshipsForPerson");

/** Updates a spouse link's lifecycle state, returning the updated row (empty if none). */
export const updateRelationshipState = (
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number],
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    const rows = await trx
      .update(relationshipsTable)
      .set({ state })
      .where(eq(relationshipsTable.id, id))
      .returning();
    return rows[0];
  }, "updateRelationshipState");

/** Deletes a relationship row by id, returning the deleted row (empty if none). */
export const deleteRelationship = (id: string, trx: DbTransaction = getDb()) =>
  withDbErrorHandling(async () => {
    const rows = await trx
      .delete(relationshipsTable)
      .where(eq(relationshipsTable.id, id))
      .returning();
    return rows[0];
  }, "deleteRelationship");

/**
 * Fetches every spouse link that touches any of the given people, with both
 * sides' membership status so widowhood (and Marital Status) can be resolved.
 */
export const getSpouseLinksForPeople = (
  personIds: string[],
  trx: DbTransaction = getDb()
) =>
  withDbErrorHandling(async () => {
    if (personIds.length === 0) {
      return [];
    }
    return await trx.query.relationshipsTable.findMany({
      where: (table, { and, eq: eqOp, or, inArray }) =>
        and(
          eqOp(table.type, RELATIONSHIP_TYPE.SPOUSE),
          or(
            inArray(table.personId, personIds),
            inArray(table.relatedPersonId, personIds)
          )
        ),
      with: {
        person: { columns: { id: true, membershipStatus: true } },
        relatedPerson: { columns: { id: true, membershipStatus: true } },
      },
    });
  }, "getSpouseLinksForPeople");
