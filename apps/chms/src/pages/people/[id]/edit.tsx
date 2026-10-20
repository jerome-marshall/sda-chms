import { useMemo } from "react";

import { useBreadcrumbs } from "@/components/header";
import EditPersonForm from "@/components/people/edit-person-form";

import type { Props } from "./edit.server";

export default function PersonEditRoute({
  person,
  relationships,
  households,
  people,
}: Props) {
  const crumbs = useMemo(
    () => [
      { label: "People", path: "/people" },
      {
        label: person?.fullName ?? "Person",
        path: `/people/${person?.id ?? ""}`,
      },
      { label: "Edit" },
    ],
    [person?.id, person?.fullName]
  );
  useBreadcrumbs(crumbs);

  if (!person) {
    return null;
  }
  return (
    <div>
      <EditPersonForm
        households={households ?? []}
        people={people ?? []}
        person={person}
        relationships={relationships ?? []}
      />
    </div>
  );
}
