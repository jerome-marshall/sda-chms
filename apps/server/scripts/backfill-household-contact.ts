import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { eq, getDb } from "@sda-chms/db";
import { householdsTable, peopleTable } from "@sda-chms/db/schema/people";

const db = getDb();

/** Contact fields the Household now owns (ADR-0001). */
const CONTACT_FIELDS = [
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "country",
  "phone",
  "preferredVisitingTime",
] as const;

/** A row (Household or Person) narrowed to just the shared contact fields. */
type ContactRow = Record<(typeof CONTACT_FIELDS)[number], string | null>;

/** The Household contact fields to seed from the Head where the Household has none yet. */
function seedFromHead(household: ContactRow, head: ContactRow) {
  const seed: Record<string, string | null> = {};
  for (const field of CONTACT_FIELDS) {
    if (!household[field] && head[field]) {
      seed[field] = head[field];
    }
  }
  return seed;
}

/** The member fields to clear because they duplicate the Household's effective value. */
function duplicatesToClear(member: ContactRow, effective: ContactRow) {
  const clear: Record<string, null> = {};
  for (const field of CONTACT_FIELDS) {
    if (member[field] && member[field] === effective[field]) {
      clear[field] = null;
    }
  }
  return clear;
}

/**
 * One-time backfill for ADR-0001 (issue #6): move the shared contact details
 * from People onto the Household they belong to.
 *
 * Before this change, non-Head members fell back to the *Head's* Person contact
 * fields. Now the Household owns those fields and a Person's own value is an
 * override. This script, run once against a populated DB:
 *
 * 1. Seeds each Household's contact fields from its Head member (only where the
 *    Household has no value yet — idempotent, safe to re-run).
 * 2. Clears each member's own contact field where it equals the Household's, so
 *    only genuinely different per-Person values remain as overrides.
 *
 * No data is lost: values that differ from the Household default are preserved
 * on the Person as overrides; everything else resolves via the effective-value
 * rule (`person ?? household`).
 */
async function backfillHouseholdContact() {
  console.log("Backfilling household-owned contact details (ADR-0001)...\n");

  const households = await db.query.householdsTable.findMany({
    with: {
      members: {
        columns: {
          id: true,
          householdRole: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          phone: true,
          preferredVisitingTime: true,
        },
      },
    },
  });

  let seeded = 0;
  let overridesCleared = 0;

  for (const household of households) {
    const head =
      household.members.find((m) => m.householdRole === "head") ??
      household.members[0];
    if (!head) {
      continue;
    }

    // 1. Seed the Household's contact fields from the Head where still unset.
    const seed = seedFromHead(household, head);
    if (Object.keys(seed).length > 0) {
      await db
        .update(householdsTable)
        .set(seed)
        .where(eq(householdsTable.id, household.id));
      seeded++;
    }
    const effective = { ...household, ...seed } as ContactRow;

    // 2. Clear each member's own field where it duplicates the Household's.
    for (const member of household.members) {
      const clear = duplicatesToClear(member, effective);
      if (Object.keys(clear).length > 0) {
        await db
          .update(peopleTable)
          .set(clear)
          .where(eq(peopleTable.id, member.id));
        overridesCleared++;
      }
    }
  }

  console.log("========== BACKFILL SUMMARY ==========");
  console.log(`Households processed:      ${households.length}`);
  console.log(`Households seeded:         ${seeded}`);
  console.log(`Members de-duplicated:     ${overridesCleared}`);
  console.log("======================================\n");
}

backfillHouseholdContact()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
