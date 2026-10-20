import type { PeopleInsertDb } from "@schema";
import { HTTPException } from "hono/http-exception";
import { inferSchema, initParser } from "udsv";
import { defineHandler } from "void/handler";
import { z } from "zod";

import { groupByHousehold } from "../../../scripts/household-resolver";
import { isValidRow, transformRow } from "../../../scripts/import-helpers";
import type { CsvRow, ImportSummary } from "../../../scripts/import-helpers";
import { getDb } from "../../../server/db";
import { insertHouseholdStmt } from "../../../server/households";
import { insertPersonStmt } from "../../../server/people";

/** Rejects past this before parsing: the whole CSV sits in memory twice. */
const MAX_CSV_CHARS = 5_000_000;

/** Rejects past this: one batch per household group must stay reasonable. */
const MAX_ROWS = 50_000;

/**
 * Development-only CSV import (the `.dev` suffix keeps it out of builds and
 * deploys). The operator's member CSV is imported through the same `void/db`
 * binding the API uses, so local D1 needs no connection string and no
 * Postgres. The thin `scripts/import-people.ts` client reads the file and
 * POSTs it here as `{ csv }`.
 */
export const POST = defineHandler.withValidator({
  body: z.object({ csv: z.string().min(1).max(MAX_CSV_CHARS) }),
})(async (_c, { body }) => {
  const csvSchema = inferSchema(body.csv);
  const parser = initParser(csvSchema);
  const allRows = parser.typedObjs(body.csv) as unknown as CsvRow[];
  if (allRows.length > MAX_ROWS) {
    throw new HTTPException(400, {
      message: `CSV has ${allRows.length} rows, limit is ${MAX_ROWS}`,
    });
  }

  const validEntries = allRows
    .map((row, i) => isValidRow(row, i + 2))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const { groups: householdGroups, rejected } = groupByHousehold(validEntries);

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
    const failGroup = (reason: string) => {
      for (const { row, csvRowNum } of group.members) {
        summary.failures.push({
          csvRowNum,
          name: String(row.Name),
          reason,
        });
      }
      summary.failed += group.members.length;
    };

    // The household id is client-generated so the whole group — household
    // plus every member — goes in one batch: all-or-nothing per group, and
    // the summary can never count a row as both succeeded and failed.
    const householdId = crypto.randomUUID();
    let peopleData: { csvRowNum: number; data: PeopleInsertDb; row: CsvRow }[];
    try {
      peopleData = group.members.map(({ row, csvRowNum }) => ({
        row,
        csvRowNum,
        data: transformRow(row, group.role(row), householdId, csvRowNum),
      }));
    } catch (error) {
      failGroup(error instanceof Error ? error.message : String(error));
      continue;
    }

    try {
      await getDb().batch([
        insertHouseholdStmt({
          id: householdId,
          familyName: group.familyName,
        }),
        ...peopleData.map(({ data }) => insertPersonStmt(data)),
      ]);
      summary.succeeded += group.members.length;
    } catch (error) {
      failGroup(error instanceof Error ? error.message : String(error));
    }
  }

  // Spouse/child rows without a Family belong to no group. They were valid
  // rows, so they count as failed with the resolver's reason instead of
  // vanishing from the summary.
  for (const { row, csvRowNum, reason } of rejected) {
    summary.failed += 1;
    summary.failures.push({
      csvRowNum,
      name: String(row.Name),
      reason,
    });
  }

  return summary;
});
