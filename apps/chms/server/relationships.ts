import { relationshipsTable } from "@schema";
import type { RelationshipsInsertDb } from "@schema";
import {
  getReciprocalRelationshipType,
  RELATIONSHIP_TYPE,
  SPOUSE_STATE,
} from "@sda-chms/shared/constants/people";
import type { SPOUSE_STATE_VALUES } from "@sda-chms/shared/constants/people";
import type { RelationshipCreate } from "@sda-chms/shared/schema/people";
import {
  isPartnerDeceased,
  resolveSpouseState,
} from "@sda-chms/shared/utils/marital-status";
import { eq } from "void/db";

import { getDb } from "./db";
import {
  planMaritalStatusUpdates,
  readSpouseLinkGraph,
} from "./marital-status";
import { getPersonById, updatePersonStmt } from "./people";

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
const getRelationshipById = (id: string) =>
  getDb().query.relationshipsTable.findFirst({
    where: (table, { eq: eqOp }) => eqOp(table.id, id),
  });

/**
 * Fetches every relationship touching a person — both the rows where they are the
 * subject (`person`) and the rows where they are the object (`relatedPerson`) —
 * each with the joined person on both sides so the link can be resolved from
 * this person's perspective.
 */
const getRelationshipsForPersonRows = (personId: string) =>
  getDb().query.relationshipsTable.findMany({
    where: (table, { or, eq: eqOp }) =>
      or(eqOp(table.personId, personId), eqOp(table.relatedPersonId, personId)),
    with: {
      person: { columns: relatedPersonColumns },
      relatedPerson: { columns: relatedPersonColumns },
    },
  });

/** Lazy insert used inside a batch; the caller reads row [0] of its result. */
const insertRelationshipStmt = (data: RelationshipsInsertDb) =>
  getDb().insert(relationshipsTable).values(data).returning();

/** Lazy spouse-state update used inside a batch. */
const updateRelationshipStateStmt = (
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number]
) =>
  getDb()
    .update(relationshipsTable)
    .set({ state })
    .where(eq(relationshipsTable.id, id))
    .returning();

/** Lazy delete used inside a batch. */
const deleteRelationshipStmt = (id: string) =>
  getDb()
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
const relationshipDbToApi = (row: RelationshipRow, personId: string) => {
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

/**
 * Creates a relationship link between two people. A spouse link carries a
 * lifecycle state (ADR-0003) — defaulting to `married` when none is supplied;
 * every other type stores no state. Creating a spouse link updates both
 * People's Marital Status to follow the governing link (issue #8).
 *
 * D1 shape: reads first (both people for existence + membership, plus the
 * surrounding spouse-link graph), the post-write link set computed in memory,
 * then every write — the link insert and the Marital Status updates — in one
 * `db.batch`. The link id is client-generated so no write depends on another
 * write's result.
 */
export const addRelationship = async (data: RelationshipCreate) => {
  const state =
    data.type === RELATIONSHIP_TYPE.SPOUSE
      ? (data.state ?? SPOUSE_STATE.MARRIED)
      : null;

  const id = crypto.randomUUID();
  const link = { ...data, id, state };

  if (data.type !== RELATIONSHIP_TYPE.SPOUSE) {
    const [createdRows] = await getDb().batch([insertRelationshipStmt(link)]);
    const created = (createdRows as unknown[])[0];
    if (!created) {
      throw new Error("Failed to create relationship");
    }
    return created;
  }

  const [person, relatedPerson] = await Promise.all([
    getPersonById(data.personId),
    getPersonById(data.relatedPersonId),
  ]);
  if (!person || !relatedPerson) {
    // Let the database enforce the link: the insert below fails on the
    // foreign key, so the API keeps the 422 it has always returned for
    // unknown ids instead of inventing a new error.
    const [createdRows] = await getDb().batch([insertRelationshipStmt(link)]);
    const created = (createdRows as unknown[])[0];
    if (!created) {
      throw new Error("Failed to create relationship");
    }
    return created;
  }
  const { rows, affected } = await readSpouseLinkGraph([
    data.personId,
    data.relatedPersonId,
  ]);
  const postWriteRows = [
    ...rows,
    {
      id,
      personId: data.personId,
      relatedPersonId: data.relatedPersonId,
      type: RELATIONSHIP_TYPE.SPOUSE,
      state,
      createdAt: new Date(),
      person: { id: person.id, membershipStatus: person.membershipStatus },
      relatedPerson: {
        id: relatedPerson.id,
        membershipStatus: relatedPerson.membershipStatus,
      },
    },
  ];

  const plans = planMaritalStatusUpdates(postWriteRows, affected);
  const [createdRows] = await getDb().batch([
    insertRelationshipStmt(link),
    ...plans.map((plan) =>
      updatePersonStmt(plan.personId, {
        maritalStatus: plan.maritalStatus,
      })
    ),
  ]);
  const created = (createdRows as unknown[])[0];
  if (!created) {
    throw new Error("Failed to create relationship");
  }
  return created;
};

/**
 * Changes a spouse link's lifecycle state (e.g. married → divorced). The link
 * persists through the change — a divorce/death is a state, not a deletion —
 * and both People's Marital Status follow the new governing state (issue #8).
 *
 * D1 shape: read the link, read the graph, apply the state change to the
 * graph in memory, then one batch (link update + Marital Status updates).
 */
export const updateRelationshipState = async (
  id: string,
  state: (typeof SPOUSE_STATE_VALUES)[number]
) => {
  const existing = await getRelationshipById(id);
  if (!existing) {
    throw new Error("Relationship not found");
  }

  if (existing.type !== RELATIONSHIP_TYPE.SPOUSE) {
    const [updatedRows] = await getDb().batch([
      updateRelationshipStateStmt(id, state),
    ]);
    const updated = (updatedRows as unknown[])[0];
    if (!updated) {
      throw new Error("Relationship not found");
    }
    return updated;
  }

  const { rows, affected } = await readSpouseLinkGraph([
    existing.personId,
    existing.relatedPersonId,
  ]);
  const postWriteRows = rows.map((row) =>
    row.id === id ? { ...row, state } : row
  );
  const plans = planMaritalStatusUpdates(postWriteRows, affected);
  const [updatedRows] = await getDb().batch([
    updateRelationshipStateStmt(id, state),
    ...plans.map((plan) =>
      updatePersonStmt(plan.personId, {
        maritalStatus: plan.maritalStatus,
      })
    ),
  ]);
  const updated = (updatedRows as unknown[])[0];
  if (!updated) {
    throw new Error("Relationship not found");
  }
  return updated;
};

/** Returns a person's relationships, each resolved from that person's perspective. */
export const getPersonRelationships = async (personId: string) => {
  const rows = await getRelationshipsForPersonRows(personId);
  return rows.map((row) => relationshipDbToApi(row, personId));
};

/**
 * Removes a relationship link by id. Removing a spouse link re-evaluates both
 * People's Marital Status from any remaining spouse links (issue #8).
 *
 * D1 shape: read the link, read the graph, drop the link from the graph in
 * memory, then one batch (link delete + Marital Status updates).
 */
export const removeRelationship = async (id: string) => {
  const existing = await getRelationshipById(id);
  if (!existing) {
    throw new Error("Relationship not found");
  }

  if (existing.type !== RELATIONSHIP_TYPE.SPOUSE) {
    await getDb().batch([deleteRelationshipStmt(id)]);
    return { id };
  }

  const { rows, affected } = await readSpouseLinkGraph([
    existing.personId,
    existing.relatedPersonId,
  ]);
  const postWriteRows = rows.filter((row) => row.id !== id);
  const plans = planMaritalStatusUpdates(postWriteRows, affected);
  await getDb().batch([
    deleteRelationshipStmt(id),
    ...plans.map((plan) =>
      updatePersonStmt(plan.personId, {
        maritalStatus: plan.maritalStatus,
      })
    ),
  ]);
  return { id: existing.id };
};
