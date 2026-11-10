import type { PersonDetail } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";

/** Returns 1–2 letter initials for the avatar fallback. */
export function getInitials(
  firstName: string,
  lastName?: string | null
): string {
  if (!lastName) {
    return firstName.charAt(0).toUpperCase();
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Converts a snake_case enum value to a human-readable label (e.g. "regular_attendee" -> "Regular Attendee"). */
export function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return value
    .replaceAll("_", " ")
    .replaceAll(/\b\w/gu, (char) => char.toUpperCase());
}

/** Maps a membership status to its Tailwind color classes for badge styling. */
export function getMembershipColor(status: string): string {
  const colors: Record<string, string> = {
    member: "bg-emerald-500/15 text-emerald-600 border-emerald-600/25",
    regular_attendee: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    visitor: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
    moved: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    deceased: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  };
  return colors[status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
}

/** Joins non-empty address fields into a comma-separated string. */
export function buildAddress(person: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  return [
    person.addressLine1,
    person.addressLine2,
    person.city,
    person.state,
    person.country,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Resolves the display address from the person's effective values, falling
 * back to the Household's shared contact details (ADR-0001).
 */
export function getAddress(person: PersonDetail) {
  const line1 = getInfoOrFromHousehold(person, "addressLine1");
  const line2 = getInfoOrFromHousehold(person, "addressLine2");
  const city = getInfoOrFromHousehold(person, "city");
  const state = getInfoOrFromHousehold(person, "state");
  const country = getInfoOrFromHousehold(person, "country");

  return {
    address: buildAddress({
      addressLine1: line1.data,
      addressLine2: line2.data,
      city: city.data,
      state: state.data,
      country: country.data,
    }),
    isAddressFromHousehold: [line1, line2, city, state, country].some(
      (field) => field.isfromHousehold
    ),
  };
}
