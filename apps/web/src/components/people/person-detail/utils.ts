import type { PersonDetail } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";

export function getInitials(
  firstName: string,
  lastName?: string | null
): string {
  if (!lastName) {
    return firstName.charAt(0).toUpperCase();
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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
 * Resolves the display address for a person, falling back to the household
 * head's address fields when the person has none of their own.
 */
export function getAddress(person: PersonDetail) {
  const { data: addressLine1, isfromHousehold: isAddressLine1FromHousehold } =
    getInfoOrFromHousehold(person, "addressLine1");
  const { data: addressLine2, isfromHousehold: isAddressLine2FromHousehold } =
    getInfoOrFromHousehold(person, "addressLine2");
  const { data: city, isfromHousehold: isCityFromHousehold } =
    getInfoOrFromHousehold(person, "city");
  const { data: state, isfromHousehold: isStateFromHousehold } =
    getInfoOrFromHousehold(person, "state");
  const { data: country, isfromHousehold: isCountryFromHousehold } =
    getInfoOrFromHousehold(person, "country");

  // Prefer the person's own fields; use head's only when the person's are absent
  const address = buildAddress({
    addressLine1: person.addressLine1 || addressLine1,
    addressLine2: person.addressLine2 || addressLine2,
    city: person.city || city,
    state: person.state || state,
    country: person.country || country,
  });
  const isAddressFromHousehold =
    isAddressLine1FromHousehold ||
    isAddressLine2FromHousehold ||
    isCityFromHousehold ||
    isStateFromHousehold ||
    isCountryFromHousehold;

  return { address, isAddressFromHousehold };
}
