import { householdsTable, peopleTable } from "@schema";
import { inferSchema, initParser } from "udsv";
import { defineHandler } from "void/handler";
import { z } from "zod";

import { groupByHousehold } from "../../scripts/household-resolver";
import { isValidRow, transformRow } from "../../scripts/import-helpers";
import type { CsvRow, ImportSummary } from "../../scripts/import-helpers";
import { getDb } from "../../server/db";

/**
 * Development-only CSV import (the `.dev` suffix keeps it out of builds and
 * deploys). The operator's member CSV is imported through the same `void/db`
 * binding the API uses, so local D1 needs no connection string and no
 * Postgres. The thin `scripts/import-people.ts` client reads the file and
 * POSTs it here as `{ csv }`.
 */
export const POST = defineHandler.withValidator({
  body: z.object({ csv: z.string().min(1) }),
})(async (_c, { body }) => {
  const csvSchema = inferSchema(body.csv);
  const parser = initParser(csvSchema);
  const allRows = parser.typedObjs(body.csv) as unknown as CsvRow[];

  const validEntries = allRows
    .map((row, i) => isValidRow(row, i + 2))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const householdGroups = groupByHousehold(validEntries);

  const summary: ImportSummary = {
    total: allRows.length,
    skipped: allRows.length - validEntries.length,
    attempted: 0,
    succeeded: 0,
    failed: 0,
    failures: [],
  };

  for (const group of householdGroups) {
    summary.attempted += group.members.length;
    // No transaction: D1 issues plain sequential writes; a mid-group failure
    // records per-row failures below.
    try {
      const [household] = await getDb()
        .insert(householdsTable)
        .values({})
        .returning();

      if (!household) {
        throw new Error("Household insert returned no result");
      }

      for (const { row, csvRowNum } of group.members) {
        const personData = transformRow(
          row,
          group.role(row),
          household.id,
          csvRowNum
        );
        await getDb().insert(peopleTable).values(personData);
        summary.succeeded++;
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      for (const { row, csvRowNum } of group.members) {
        summary.failures.push({
          csvRowNum,
          name: String(row.Name),
          reason: err,
        });
      }
      summary.failed += group.members.length;
    }
  }

  return summary;
});
