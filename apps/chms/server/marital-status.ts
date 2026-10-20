import type {
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
} from "@sda-chms/shared/constants/people";
import { RELATIONSHIP_TYPE } from "@sda-chms/shared/constants/people";
import {
  isPartnerDeceased,
  maritalStatusFromSpouseState,
  selectGoverningSpouseState,
} from "@sda-chms/shared/utils/marital-status";
import type { SpouseLinkForMaritalStatus } from "@sda-chms/shared/utils/marital-status";

import { getDb } from "./db";

type MembershipStatus = (typeof MEMBERSHIP_STATUS_VALUES)[number];
type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

/** A membership value the pending writes change, applied in memory before the batch. */
export type MembershipOverrides = Map<string, MembershipStatus>;

/** One person's stored Marital Status rewrite derived from the post-write link set. */
export interface MaritalStatusPlan {
  personId: string;
  maritalStatus: MaritalStatus;
}

/**
 * Fetches every spouse link that touches any of the given people, with both
 * sides' membership status so widowhood (and Marital Status) can be resolved.
 */
const getSpouseLinksForPeople = async (personIds: string[]) => {
  if (personIds.length === 0) {
    return [];
  }
  return await getDb().query.relationshipsTable.findMany({
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
};

type SpouseLinkRow = Awaited<
  ReturnType<typeof getSpouseLinksForPeople>
>[number];

/** Maps stored spouse rows into the per-person shape the governing-link rule uses. */
const toSpouseLinksForPerson = (
  rows: SpouseLinkRow[],
  personId: string,
  overrides: MembershipOverrides = new Map()
): SpouseLinkForMaritalStatus[] =>
  rows
    .filter(
      (row) => row.personId === personId || row.relatedPersonId === personId
    )
    .map((row) => {
      const isSubject = row.personId === personId;
      const partner = isSubject ? row.relatedPerson : row.person;
      const partnerId = isSubject ? row.relatedPersonId : row.personId;
      return {
        createdAt: row.createdAt,
        partnerDeceased: isPartnerDeceased(
          overrides.get(partnerId) ?? partner.membershipStatus
        ),
        storedState: row.state,
      };
    });

/**
 * Pure: the Marital Status implied by a person's governing spouse link within
 * an already-read graph, or null when no spouse link exists. Lets callers
 * reuse one readSpouseLinkGraph result instead of querying twice.
 */
export const governingMaritalStatusInGraph = (
  rows: SpouseLinkRow[],
  personId: string
) => {
  const governing = selectGoverningSpouseState(
    toSpouseLinksForPerson(rows, personId)
  );
  return governing ? maritalStatusFromSpouseState(governing) : null;
};

/**
 * Reads the spouse-link graph around the given people the way the old
 * transactional sync did: links touching the ids, expanded to both sides of
 * every matched link (a partner's other links govern them too), then links
 * touching the expanded set. Pure reads — every write the caller plans from
 * this graph goes into the caller's single batch.
 */
export const readSpouseLinkGraph = async (personIds: string[]) => {
  const uniqueIds = [...new Set(personIds)];
  if (uniqueIds.length === 0) {
    return { rows: [] as SpouseLinkRow[], affected: [] as string[] };
  }
  const firstPass = await getSpouseLinksForPeople(uniqueIds);
  const affected = new Set(uniqueIds);
  for (const row of firstPass) {
    affected.add(row.personId);
    affected.add(row.relatedPersonId);
  }
  const rows =
    affected.size === uniqueIds.length
      ? firstPass
      : await getSpouseLinksForPeople([...affected]);
  return { rows, affected: [...affected] };
};

/**
 * Pure: derives every affected Person's stored Marital Status from the
 * post-write spouse-link set (ADR-0003 / issue #8). The caller applies its
 * pending write to `rows` in memory first (add / restate / remove the link,
 * override a changed membership), then turns each plan into an
 * `updatePersonStmt` in its single batch. People with no governing link are
 * left as-is so Marital Status can still be set manually.
 */
export const planMaritalStatusUpdates = (
  rows: SpouseLinkRow[],
  affectedPersonIds: string[],
  overrides: MembershipOverrides = new Map()
): MaritalStatusPlan[] => {
  const plans: MaritalStatusPlan[] = [];
  for (const personId of new Set(affectedPersonIds)) {
    const governing = selectGoverningSpouseState(
      toSpouseLinksForPerson(rows, personId, overrides)
    );
    if (!governing) {
      continue;
    }
    plans.push({
      personId,
      maritalStatus: maritalStatusFromSpouseState(governing),
    });
  }
  return plans;
};
