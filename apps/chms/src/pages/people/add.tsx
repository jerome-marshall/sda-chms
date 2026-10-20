import { useMemo } from "react";

import { useBreadcrumbs } from "@/components/header";
import AddPersonForm from "@/components/people/add-person-form";

import type { Props } from "./add.server";

export default function PeopleAddPage({ households }: Props) {
  const crumbs = useMemo(
    () => [{ label: "People", path: "/people" }, { label: "Add" }],
    []
  );
  useBreadcrumbs(crumbs);

  return <AddPersonForm households={households ?? []} />;
}
