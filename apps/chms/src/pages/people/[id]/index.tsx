import { useMemo } from "react";

import { useBreadcrumbs } from "@/components/header";
import PersonDetailPage from "@/components/people/person-detail";

import type { Props } from "./index.server";

export default function PersonDetailRoute({
  person,
  relationships,
  people,
}: Props) {
  const crumbs = useMemo(
    () => [
      { label: "People", path: "/people" },
      { label: person?.fullName ?? "Person" },
    ],
    [person?.fullName]
  );
  useBreadcrumbs(crumbs);

  if (!person) {
    return null;
  }
  return (
    <PersonDetailPage
      person={person}
      relationships={relationships ?? []}
      people={people ?? []}
    />
  );
}
