import type { CsvRow } from "./import-helpers";

export interface HouseholdGroup {
  familyName: string | null;
  members: { row: CsvRow; csvRowNum: number }[];
  role: (row: CsvRow) => string;
}

interface ValidEntry {
  csvRowNum: number;
  row: CsvRow;
}

function getFamily(row: CsvRow): string {
  const family = row.Family;
  if (typeof family === "string") {
    return family.trim();
  }
  if (typeof family === "number" || typeof family === "boolean") {
    return String(family);
  }
  return "";
}

function getRelation(row: CsvRow): string {
  const relation = row.Relation;
  if (typeof relation === "string") {
    return relation.trim().toLowerCase();
  }
  if (typeof relation === "number" || typeof relation === "boolean") {
    return String(relation);
  }
  return "";
}

function isOrphanedDependent(relation: string, family: string): boolean {
  return !family && ["spouse", "child"].includes(relation);
}

export function groupByHousehold(validRows: ValidEntry[]): HouseholdGroup[] {
  const familyMap = new Map<string, ValidEntry[]>();
  const individuals: ValidEntry[] = [];

  for (const entry of validRows) {
    const family = getFamily(entry.row);
    const relation = getRelation(entry.row);

    if (isOrphanedDependent(relation, family)) {
      console.warn(
        `[Row ${entry.csvRowNum}] ${relation} without Family — skipping`
      );
      continue;
    }

    if (!family || relation === "individual") {
      individuals.push(entry);
    } else {
      if (!familyMap.has(family)) {
        familyMap.set(family, []);
      }
      familyMap.get(family)?.push(entry);
    }
  }

  const groups: HouseholdGroup[] = [];

  for (const [familyName, members] of familyMap) {
    groups.push({
      familyName,
      members,
      role: (row) => getRelation(row) || "head",
    });
  }

  for (const individual of individuals) {
    groups.push({
      familyName: null,
      members: [individual],
      role: () => "head",
    });
  }

  return groups;
}
