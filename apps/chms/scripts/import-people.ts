import { readFileSync } from "node:fs";

import type { ImportSummary } from "./import-helpers";

const csvPath =
  process.argv[2] ?? "~/Downloads/SDA Appavu Nagar Church Members Info.csv";
const resolvedPath = csvPath.replace(/^~/u, process.env.HOME ?? "");
const baseUrl =
  process.argv[3] ?? process.env.CHMS_URL ?? "http://localhost:3001";

const csvText = readFileSync(resolvedPath, "utf-8");

const res = await fetch(`${baseUrl}/api/import`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ csv: csvText }),
});

if (!res.ok) {
  throw new Error(`import failed: ${res.status} ${await res.text()}`);
}

const summary = (await res.json()) as ImportSummary;

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
