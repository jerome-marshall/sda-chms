import { type DbTransaction, getDb } from "@sda-chms/db";
import {
  isPartnerDeceased,
  maritalStatusFromSpouseState,
  type SpouseLinkForMaritalStatus,
  selectGoverningSpouseState,
} from "@sda-chms/shared/utils/marital-status";
import { updatePerson } from "../data-access/people";
import { getSpouseLinksForPeople } from "../data-access/relationships";

type SpouseLinkRow = Awaited<
  ReturnType<typeof getSpouseLinksForPeople>
>[number];

/** Maps stored spouse rows into the per-person shape the governing-link rule uses. */
const toSpouseLinksForPerson = (
  rows: SpouseLinkRow[],
  personId: string
): SpouseLinkForMaritalStatus[] =>
  rows
    .filter(
      (row) => row.personId === personId || row.relatedPersonId === personId
    )
    .map((row) => {
      const partner =
        row.personId === personId ? row.relatedPerson : row.person;
      return {
        createdAt: row.createdAt,
        partnerDeceased: isPartnerDeceased(partner.membershipStatus),
        storedState: row.state,
      };
    });

/**
 * The Marital Status implied by a Person's governing spouse link, or null when
 * no spouse Relationship exists (Marital Status stays manual).
 */
export const getGoverningMaritalStatus = async (
  personId: string,
  trx: DbTransaction = getDb()
) => {
  const rows = await getSpouseLinksForPeople([personId], trx);
  const governing = selectGoverningSpouseState(
    toSpouseLinksForPerson(rows, personId)
  );
  return governing ? maritalStatusFromSpouseState(governing) : null;
};

/**
 * Writes each affected Person's stored Marital Status from their governing
 * spouse link (ADR-0003 / issue #8). People with no remaining spouse link are
 * left as-is so Marital Status can still be set manually.
 */
export const syncMaritalStatusForPeople = async (
  personIds: string[],
  trx: DbTransaction = getDb()
) => {
  const uniqueIds = [...new Set(personIds)];
  if (uniqueIds.length === 0) {
    return;
  }

  const firstPass = await getSpouseLinksForPeople(uniqueIds, trx);
  const affected = new Set(uniqueIds);
  for (const row of firstPass) {
    affected.add(row.personId);
    affected.add(row.relatedPersonId);
  }

  const rows =
    affected.size === uniqueIds.length
      ? firstPass
      : await getSpouseLinksForPeople([...affected], trx);

  for (const personId of affected) {
    const governing = selectGoverningSpouseState(
      toSpouseLinksForPerson(rows, personId)
    );
    if (!governing) {
      continue;
    }
    await updatePerson(
      personId,
      { maritalStatus: maritalStatusFromSpouseState(governing) },
      trx
    );
  }
};
