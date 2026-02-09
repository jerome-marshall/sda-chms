import type { PersonData } from "./types";

export function getInitials(firstName: string, lastName: string): string {
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

export function buildAddress(person: PersonData): string {
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
