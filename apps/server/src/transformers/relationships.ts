import {
  getReciprocalRelationshipType,
  MEMBERSHIP_STATUS,
  RELATIONSHIP_TYPE,
  SPOUSE_STATE,
} from "@sda-chms/shared/constants/people";
import type { getRelationshipsForPerson } from "../data-access/relationships";

// Inferred from the data-access query so it stays in sync with the columns selected.
type RelationshipRow = Awaited<
  ReturnType<typeof getRelationshipsForPerson>
>[number];

type RelatedPerson = RelationshipRow["person"];

const fullName = (person: RelatedPerson) =>
  `${person.firstName} ${person.lastName ?? ""}`.trim();

/**
 * The lifecycle state shown for a link from one person's perspective. Only spouse
 * links have a state. Widowhood is derived: if the partner is deceased and the
 * marriage did not end in divorce, the state reads `widowed` regardless of the
 * stored value; otherwise the stored state stands.
 */
const resolveSpouseState = (
  type: RelationshipRow["type"],
  storedState: RelationshipRow["state"],
  partnerMembershipStatus: RelatedPerson["membershipStatus"]
) => {
  if (type !== RELATIONSHIP_TYPE.SPOUSE) {
    return null;
  }
  const partnerDeceased =
    partnerMembershipStatus === MEMBERSHIP_STATUS.DECEASED;
  if (partnerDeceased && storedState !== SPOUSE_STATE.DIVORCED) {
    return SPOUSE_STATE.WIDOWED;
  }
  return storedState;
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
    state: resolveSpouseState(type, row.state, relatedPerson.membershipStatus),
    relatedPerson: {
      id: relatedPerson.id,
      firstName: relatedPerson.firstName,
      lastName: relatedPerson.lastName,
      photoUrl: relatedPerson.photoUrl,
      fullName: fullName(relatedPerson),
    },
  };
};

/** Batch-resolves a person's relationship rows into the per-person API shape. */
export const relationshipsDbToApi = (
  rows: RelationshipRow[],
  personId: string
) => rows.map((row) => relationshipDbToApi(row, personId));
