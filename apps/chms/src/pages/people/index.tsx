import { Link } from "@void/react";
import { Download, Plus } from "lucide-react";
import { useMemo } from "react";

import { useBreadcrumbs } from "@/components/header";
import { PeopleList } from "@/components/people/people-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Props } from "./index.server";

export default function PeopleIndexPage({ people }: Props) {
  const crumbs = useMemo(() => [{ label: "People" }], []);
  useBreadcrumbs(crumbs);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-hidden">
      <div className="flex justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          People Directory
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button className="gap-2 shadow-sm" size="sm" variant="outline">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Link
            className={cn(buttonVariants({ size: "sm" }), "gap-2 shadow-sm")}
            href="/people/add"
          >
            <Plus className="h-4 w-4" />
            Add Person
          </Link>
        </div>
      </div>
      <PeopleList people={people ?? []} />
    </div>
  );
}
