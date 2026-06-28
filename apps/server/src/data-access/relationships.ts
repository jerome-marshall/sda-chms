import { eq, getDb } from "@sda-chms/db";
import {
  type RelationshipsInsertDb,
  relationshipsTable,
} from "@sda-chms/db/schema/people";
import { withDbErrorHandling } from "../lib/errors";

/** The person columns surfaced for each side of a relationship. */
const relatedPersonColumns = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
} as const;

/** Inserts a relationship row (one direction; the reciprocal is derived on read). */
export const insertRelationship = (data: RelationshipsInsertDb) =>
  withDbErrorHandling(async () => {
    const rows = await getDb()
      .insert(relationshipsTable)
      .values(data)
      .returning();
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

/** Deletes a relationship row by id, returning the deleted row (empty if none). */
export const deleteRelationship = (id: string) =>
  withDbErrorHandling(async () => {
    const rows = await getDb()
      .delete(relationshipsTable)
      .where(eq(relationshipsTable.id, id))
      .returning();
    return rows[0];
  }, "deleteRelationship");
