import { relationshipsTable } from "@schema";
import type { RelationshipsInsertDb } from "@schema";
import {
  getReciprocalRelationshipType,
  RELATIONSHIP_TYPE,
} from "@sda-chms/shared/constants/people";
import type { SPOUSE_STATE_VALUES } from "@sda-chms/shared/constants/people";
import {
  isPartnerDeceased,
  resolveSpouseState,
} from "@sda-chms/shared/utils/marital-status";
import { eq } from "void/db";

import type { Database } from "./db";

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

/** Fetches a single relationship row by id (read-first step for batch rewrites). */
export const getRelationshipRowById = (db: Database, id: string) =>
  db.query.relationshipsTable.findFirst({
    where: (table, { eq: eqOp }) => eqOp(table.id, id),
  });

/**
 * Fetches every relationship touching a person — both the rows where they are the
 * subject (`person`) and the rows where they are the object (`relatedPerson`) —
 * each with the joined person on both sides so the link can be resolved from
 * this person's perspective.
 */
export const getRelationshipsForPersonRows = (db: Database, personId: string) =>
  db.query.relationshipsTable.findMany({
    where: (table, { or, eq: eqOp }) =>
      or(eqOp(table.personId, personId), eqOp(table.relatedPersonId, personId)),
    with: {
      person: { columns: relatedPersonColumns },
      relatedPerson: { columns: relatedPersonColumns },
    },
  });

/** Lazy insert used inside a batch; the caller reads row [0] of its result. */
export const insertRelationshipStmt = (
  db: Database,
  data: RelationshipsInsertDb
) => db.insert(relationshipsTable).values(data).returning();

/** Lazy spouse-state update used inside a batch. */
export const updateRelationshipStateStmt = (
  db: Database,
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number]
) =>
  db
    .update(relationshipsTable)
    .set({ state })
    .where(eq(relationshipsTable.id, id))
    .returning();

/** Lazy delete used inside a batch. */
export const deleteRelationshipStmt = (db: Database, id: string) =>
  db
    .delete(relationshipsTable)
    .where(eq(relationshipsTable.id, id))
    .returning();

// Inferred from the query so it stays in sync with the columns selected.
type RelationshipRow = Awaited<
  ReturnType<typeof getRelationshipsForPersonRows>
>[number];

type RelatedPerson = RelationshipRow["person"];

const fullName = (person: RelatedPerson) =>
  `${person.firstName} ${person.lastName ?? ""}`.trim();

/**
 * The lifecycle state shown for a link from one person's perspective. Only
 * spouse links have a state; widowhood is derived in shared (ADR-0003).
 */
const spouseStateForLink = (
  type: RelationshipRow["type"],
  storedState: RelationshipRow["state"],
  partnerMembershipStatus: RelatedPerson["membershipStatus"]
) => {
  if (type !== RELATIONSHIP_TYPE.SPOUSE) {
    return null;
  }
  return resolveSpouseState(
    storedState,
    isPartnerDeceased(partnerMembershipStatus)
  );
};

/**
 * Resolves a stored relationship row into the link as seen from `personId`.
 *
 * A row reads "relatedPerson is `type` of person". When `personId` is the subject
 * (`person`), the other party and type are taken as stored. When `personId` is the
 * object (`relatedPerson`), the type is flipped to its reciprocal (ADR-0003) so,
 * e.g., the parent's list shows the child as `child`.
 */
export const relationshipDbToApi = (row: RelationshipRow, personId: string) => {
  const isSubject = row.personId === personId;
  const relatedPerson = isSubject ? row.relatedPerson : row.person;
  const type = isSubject ? row.type : getReciprocalRelationshipType(row.type);

  return {
    id: row.id,
    type,
    state: spouseStateForLink(type, row.state, relatedPerson.membershipStatus),
    relatedPerson: {
      id: relatedPerson.id,
      firstName: relatedPerson.firstName,
      lastName: relatedPerson.lastName,
      photoUrl: relatedPerson.photoUrl,
      fullName: fullName(relatedPerson),
    },
  };
};
