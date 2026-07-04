import { getReciprocalRelationshipType } from "@sda-chms/shared/constants/people";
import type { getRelationshipsForPerson } from "../data-access/relationships";

// Inferred from the data-access query so it stays in sync with the columns selected.
type RelationshipRow = Awaited<
  ReturnType<typeof getRelationshipsForPerson>
>[number];

type RelatedPerson = RelationshipRow["person"];

const fullName = (person: RelatedPerson) =>
  `${person.firstName} ${person.lastName ?? ""}`.trim();

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
