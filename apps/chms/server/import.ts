import type { PeopleInsertDb } from "@schema";
import { HTTPException } from "hono/http-exception";
import { inferSchema, initParser } from "udsv";

import { groupByHousehold } from "../scripts/household-resolver";
import { isValidRow, transformRow } from "../scripts/import-helpers";
import type { CsvRow, ImportSummary } from "../scripts/import-helpers";
import { getDb } from "./db";
import { insertHouseholdStmt } from "./households";
import { insertPersonStmt } from "./people";

/** Rejects past this before parsing: the whole CSV sits in memory twice. */
export const MAX_CSV_CHARS = 5_000_000;

/** Rejects past this: one batch per household group must stay reasonable. */
const MAX_ROWS = 50_000;

/**
 * Imports the operator's member CSV into local D1. Each Household group runs
 * as one batch, so a failing row cannot leave a half-imported family.
 */
export const importPeopleCsv = async (csv: string): Promise<ImportSummary> => {
  const parser = initParser(inferSchema(csv));
  const allRows = parser.typedObjs(csv) as unknown as CsvRow[];
  if (allRows.length > MAX_ROWS) {
    throw new HTTPException(400, {
      message: `CSV has ${allRows.length} rows, limit is ${MAX_ROWS}`,
    });
  }

  const validEntries = allRows
    .map((row, index) => isValidRow(row, index + 2))
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
};
