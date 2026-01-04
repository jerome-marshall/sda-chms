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
