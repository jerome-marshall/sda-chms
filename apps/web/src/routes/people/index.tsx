import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import PeopleList from "@/components/people/people-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { queryOptions } from "@/lib/query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/people/")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(queryOptions.people());
  },
});

function RouteComponent() {
  return (
    <div className="flex max-h-[calc(100vh-6rem)] min-h-0 flex-1 flex-col space-y-6">
      <div className="flex justify-between gap-4">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          People Directory
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <Button className="gap-2 shadow-sm" size="sm" variant="outline">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Link
            className={cn(buttonVariants({ size: "sm" }), "gap-2 shadow-sm")}
            to="/people/add"
          >
            <Plus className="h-4 w-4" />
            Add Person
          </Link>
        </div>
      </div>

      <PeopleList />
    </div>
  );
}
