import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
} from "@sda-chms/shared/constants/people";
import type { ImportantDate } from "@sda-chms/shared/schema/people";

import type { PeopleInsertDb } from "../src/db/schema/people";

export interface CsvRow {
  Address: unknown;
  "Baptism Date": unknown;
  "Baptism Place": unknown;
  "Dates to Remember": unknown;
  "Dietary Pref.": unknown;
  DOB: unknown;
  Email: unknown;
  Family: unknown;
  Gender: unknown;
  "Marital Status": unknown;
  Memorial: unknown;
  Name: unknown;
  Occupation: unknown;
  Phone: unknown;
  "Pref. Home Visit": unknown;
  Relation: unknown;
  "Wedding Date": unknown;
}

export interface FailedRow {
  csvRowNum: number;
  name: string;
  reason: string;
}

export interface ImportSummary {
  attempted: number;
  failed: number;
  failures: FailedRow[];
  skipped: number;
  succeeded: number;
  total: number;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === "") {
    return null;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  return null;
}

const YEAR_ONLY_RE = /^\d{4}$/u;
const MONTH_YEAR_RE = /^(?<month>\d{1,2})\/(?<year>\d{4})$/u;
const FULL_DATE_RE = /^(?<day>\d{1,2})\/(?<month>\d{1,2})\/(?<year>\d{4})$/u;
const WHITESPACE_RE = /\s+/u;
const NEWLINE_RE = /\n/u;
const WHITESPACE_GLOBAL_RE = /\s+/gu;

export function normalizeDate(raw: string | undefined | null): string | null {
  if (!raw || raw.trim() === "" || raw.trim() === "?") {
    return null;
  }
  const trimmed = raw.trim();

  if (YEAR_ONLY_RE.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  const monthYearMatch = MONTH_YEAR_RE.exec(trimmed);
  if (monthYearMatch?.[1] && monthYearMatch[2]) {
    const month = monthYearMatch[1].padStart(2, "0");
    return `${monthYearMatch[2]}-${month}-01`;
  }

  const slashMatch = FULL_DATE_RE.exec(trimmed);
  if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
    const year = slashMatch[3];
    let day = Number.parseInt(slashMatch[1], 10);
    let month = Number.parseInt(slashMatch[2], 10);

    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

export function splitName(fullName: string): {
  firstName: string;
  lastName: string | null;
} {
  const parts = fullName.trim().split(WHITESPACE_RE);
  const firstName = parts[0] ?? fullName.trim();
  return {
    firstName,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export function parseImportantDates(
  raw: string | undefined | null,
  csvRowNum: number
): ImportantDate[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  const results: ImportantDate[] = [];
  for (const line of raw.split(NEWLINE_RE).filter((l) => l.trim() !== "")) {
    const parts = line.split("-").map((p) => p.trim());
    if (parts.length < 2) {
      console.warn(`[Row ${csvRowNum}] Malformed important date: "${line}"`);
      continue;
    }
    const dateStr = normalizeDate(parts[0]);
    if (!dateStr) {
      console.warn(
        `[Row ${csvRowNum}] Unparseable date in important dates: "${parts[0]}"`
      );
      continue;
    }
    const occasion = parts.slice(1).join("-").trim();
    results.push({
      id: crypto.randomUUID(),
      date: dateStr,
      name: !occasion || occasion === "?" ? "unknown" : occasion,
      recurrence: "yearly",
    });
  }
  return results;
}

function mapEnum(
  raw: string | undefined | null,
  allowed: readonly string[],
  fieldName: string
): string | null {
  if (!raw || raw.trim() === "") {
    return null;
  }
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(WHITESPACE_GLOBAL_RE, "_");
  if (!allowed.includes(normalized)) {
    throw new Error(`Invalid ${fieldName} value: "${raw}"`);
  }
  return normalized;
}

export const mapGender = (raw: string) => mapEnum(raw, GENDER_VALUES, "gender");
export const mapMaritalStatus = (raw: string) =>
  mapEnum(raw, MARITAL_STATUS_VALUES, "maritalStatus");
export const mapDietaryPreference = (raw: string) =>
  mapEnum(raw, DIETARY_PREFERENCES_VALUES, "dietaryPreference");

const ROLE_MAP: Record<string, string> = {
  head: "head",
  spouse: "spouse",
  child: "child",
  individual: "head",
};

export function mapHouseholdRole(relation: string): string {
  const role = ROLE_MAP[relation.trim().toLowerCase()];
  if (!role) {
    throw new Error(`Invalid relation/role: "${relation}"`);
  }
  return role;
}

export function isValidRow(
  row: CsvRow,
  csvRowNum: number
): { row: CsvRow; csvRowNum: number } | null {
  if (!str(row.Name)) {
    console.warn(`[Row ${csvRowNum}] Skipped — no Name`);
    return null;
  }
  return { row, csvRowNum };
}

export function transformRow(
  row: CsvRow,
  relation: string,
  householdId: string,
  csvRowNum: number
): PeopleInsertDb {
  const { firstName, lastName } = splitName(str(row.Name) ?? "");

  return {
    firstName,
    lastName,
    gender: mapGender(str(row.Gender) ?? "") as PeopleInsertDb["gender"],
    dateOfBirth: normalizeDate(str(row.DOB)),
    memorialDay: normalizeDate(str(row.Memorial)),
    phone: str(row.Phone),
    email: str(row.Email),
    occupation: str(row.Occupation),
    preferredVisitingTime: str(row["Pref. Home Visit"]),
    addressLine1: str(row.Address),
    baptismDate: normalizeDate(str(row["Baptism Date"])),
    baptismPlace: str(row["Baptism Place"]),
    maritalStatus: (mapMaritalStatus(str(row["Marital Status"]) ?? "") ??
      "single") as PeopleInsertDb["maritalStatus"],
    weddingDate: normalizeDate(str(row["Wedding Date"])),
    dietaryPreference: mapDietaryPreference(str(row["Dietary Pref."]) ?? ""),
    importantDates: parseImportantDates(
      str(row["Dates to Remember"]),
      csvRowNum
    ),
    membershipStatus: "member",
    isActive: true,
    householdId,
    householdRole: mapHouseholdRole(
      relation
    ) as PeopleInsertDb["householdRole"],
  };
}
