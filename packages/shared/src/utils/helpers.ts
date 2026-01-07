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
 * Converts a string to Title Case (first letter uppercase, rest lowercase)
 * Handles multi-word names like "Mary Jane" or hyphenated names like "Jean-Pierre"
 */
export const toTitleCase = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s-])\w/g, (match) => match.toUpperCase());
};

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
