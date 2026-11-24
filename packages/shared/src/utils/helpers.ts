export const toDate = (value: string | Date | undefined | null) => {
  if (!value) {
    return;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
};

/**
 * Formats a Date to a date-only string (YYYY-MM-DD) in local timezone.
 * This avoids timezone issues where toISOString() would shift the date.
 */
export const toDateString = (date: Date | undefined | null) => {
  if (!date) {
    return;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toTitleCase = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .replaceAll(/(?:^|[\s-])\w/gu, (match) => match.toUpperCase());

export const calculateAge = (
  dateOfBirth?: Date | string | null,
  referenceDate: Date = new Date()
) => {
  const dob = toDate(dateOfBirth);

  if (!dob) {
    return;
  }

  const today = referenceDate;
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
};
