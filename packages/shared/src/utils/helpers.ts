/** Safely converts a string or Date to a Date, returning undefined for invalid/empty values. */
export const toDate = (value: string | Date | undefined | null) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  // Only convert non-empty string values
  if (typeof value === "string" && value.trim().length > 0) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

/**
 * Formats a Date to a date-only string (YYYY-MM-DD) in local timezone.
 * This avoids timezone issues where toISOString() would shift the date.
 */
export const toDateString = (date: Date | undefined | null) => {
  if (!date) {
    return undefined;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Converts a string to Title Case (first letter uppercase, rest lowercase)
 * Handles multi-word names like "Mary Jane" or hyphenated names like "Jean-Pierre"
 */
export const toTitleCase = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s-])\w/g, (match) => match.toUpperCase());
};

/** Calculates age in whole years from a date of birth, adjusting for whether the birthday has passed this year. */
export const calculateAge = (dateOfBirth: Date | string | undefined | null) => {
  const dob = toDate(dateOfBirth);

  if (!dob) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
};
