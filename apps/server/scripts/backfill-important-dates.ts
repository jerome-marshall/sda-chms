import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { db, eq } from "@sda-chms/db";
import { peopleTable } from "@sda-chms/db/schema/people";

/**
 * Backfills existing importantDates entries with `id` and `recurrence` fields
 * that were added in the schema upgrade. Entries missing these fields get a
 * generated UUID and default to "yearly" recurrence.
 */
async function backfill() {
  const people = await db
    .select({ id: peopleTable.id, importantDates: peopleTable.importantDates })
    .from(peopleTable);

  let updated = 0;

  for (const person of people) {
    const dates = person.importantDates;
    if (!dates || dates.length === 0) {
      continue;
    }

    const needsBackfill = dates.some((d) => !(d.id && d.recurrence));
    if (!needsBackfill) {
      continue;
    }

    const patched = dates.map((d) => ({
      ...d,
      id: d.id || crypto.randomUUID(),
      recurrence: d.recurrence || ("yearly" as const),
    }));

    await db
      .update(peopleTable)
      .set({ importantDates: patched })
      .where(eq(peopleTable.id, person.id));

    updated++;
  }

  console.log(
    `Backfill complete: ${updated} people updated out of ${people.length} total.`
  );
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
