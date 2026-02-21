import type { PeopleInsertDb } from "@sda-chms/db/schema/people";
import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
} from "@sda-chms/shared/constants/people";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CsvRow {
  Name: unknown;
  Gender: unknown;
  DOB: unknown;
  Memorial: unknown;
  Phone: unknown;
  Email: unknown;
  Occupation: unknown;
  "Pref. Home Visit": unknown;
  Address: unknown;
  "Baptism Date": unknown;
  "Baptism Place": unknown;
  "Marital Status": unknown;
  "Wedding Date": unknown;
  "Dietary Pref.": unknown;
  "Dates to Remember": unknown;
  Family: unknown;
  Relation: unknown;
}

export interface FailedRow {
  csvRowNum: number;
  name: string;
  reason: string;
}

export interface ImportSummary {
  total: number;
  skipped: number;
  attempted: number;
  succeeded: number;
  failed: number;
  failures: FailedRow[];
}

// ---------------------------------------------------------------------------
// Safely coerce udsv values (numbers, nulls) to string before trimming
// ---------------------------------------------------------------------------

function str(val: unknown): string | null {
  if (val == null || val === "") {
    return null;
  }
  const s = String(val).trim();
  return s === "" ? null : s;
}

// ---------------------------------------------------------------------------
// Top-level regex constants
// ---------------------------------------------------------------------------

const YEAR_ONLY_RE = /^\d{4}$/;
const MONTH_YEAR_RE = /^(\d{1,2})\/(\d{4})$/;
const FULL_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const WHITESPACE_RE = /\s+/;
const NEWLINE_RE = /\n/;
const WHITESPACE_GLOBAL_RE = /\s+/g;

// ---------------------------------------------------------------------------
// Date Sanitization (planning doc section 5)
// ---------------------------------------------------------------------------

export function normalizeDate(raw: string | undefined | null): string | null {
  if (!raw || raw.trim() === "" || raw.trim() === "?") {
    return null;
  }
  const trimmed = raw.trim();

  // yyyy only
  if (YEAR_ONLY_RE.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  // m/yyyy or mm/yyyy
  const monthYearMatch = trimmed.match(MONTH_YEAR_RE);
  if (monthYearMatch?.[1] && monthYearMatch[2]) {
    const month = monthYearMatch[1].padStart(2, "0");
    return `${monthYearMatch[2]}-${month}-01`;
  }

  // d/m/yyyy or dd/mm/yyyy (with occasional m/d/yyyy legacy outlier)
  const slashMatch = trimmed.match(FULL_DATE_RE);
  if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
    const year = slashMatch[3];
    let day = Number.parseInt(slashMatch[1], 10);
    let month = Number.parseInt(slashMatch[2], 10);

    // day > 12 is unambiguously d/m/y; if month > 12 it's a legacy m/d/y outlier
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Name Splitting
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Important Dates Parsing (planning doc section 6)
// ---------------------------------------------------------------------------

export function parseImportantDates(
  raw: string | undefined | null,
  csvRowNum: number
): { date: string; name: string }[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  const results: { date: string; name: string }[] = [];
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
      date: dateStr,
      name: !occasion || occasion === "?" ? "unknown" : occasion,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Enum Mappers (planning doc section 8)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Row Filter (planning doc section 7)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Row Transform — CSV row to PeopleInsertDb
// ---------------------------------------------------------------------------

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
