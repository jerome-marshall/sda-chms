import { readFileSync } from "node:fs";

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { inferSchema, initParser } from "udsv";

import * as schema from "../db/schema";
import { householdsTable, peopleTable } from "../db/schema/people";
import { groupByHousehold } from "./household-resolver";
import { isValidRow, transformRow } from "./import-helpers";
import type { CsvRow, ImportSummary } from "./import-helpers";

// Local tooling, run from apps/chms so `.env` resolves to the app's file.
dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set — create apps/chms/.env first");
}
const db = drizzle(databaseUrl, { schema });

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
