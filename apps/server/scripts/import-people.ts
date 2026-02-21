import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { readFileSync } from "node:fs";
import { db } from "@sda-chms/db";
import { householdsTable, peopleTable } from "@sda-chms/db/schema/people";
import { inferSchema, initParser } from "udsv";
import { groupByHousehold } from "./household-resolver";
import {
  type CsvRow,
  type ImportSummary,
  isValidRow,
  transformRow,
} from "./import-helpers";

const csvPath =
  process.argv[2] ?? "~/Downloads/SDA Appavu Nagar Church Members Info.csv";
const resolvedPath = csvPath.replace("~", process.env.HOME ?? "");

const csvText = readFileSync(resolvedPath, "utf-8");

const csvSchema = inferSchema(csvText);
const parser = initParser(csvSchema);
const allRows = parser.typedObjs(csvText) as unknown as CsvRow[];

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
  try {
    await db.transaction(async (trx) => {
      const [household] = await trx
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
        await trx.insert(peopleTable).values(personData);
        summary.succeeded++;
      }
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    for (const { row, csvRowNum } of group.members) {
      summary.failures.push({ csvRowNum, name: String(row.Name), reason: err });
    }
    summary.failed += group.members.length;
  }
}

console.log("\n========== IMPORT SUMMARY ==========");
console.log(`Total CSV rows:     ${summary.total}`);
console.log(`Rows skipped:       ${summary.skipped}`);
console.log(`Rows attempted:     ${summary.attempted}`);
console.log(`Rows succeeded:     ${summary.succeeded}`);
console.log(`Rows failed:        ${summary.failed}`);
if (summary.failures.length > 0) {
  console.log("\nFailed rows:");
  for (const f of summary.failures) {
    console.log(`  Row ${f.csvRowNum} (${f.name}): ${f.reason}`);
  }
}
console.log("====================================\n");
