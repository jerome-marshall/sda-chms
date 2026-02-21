import { createFileRoute } from "@tanstack/react-router";
import PeopleList from "@/components/people/people-list";

export const Route = createFileRoute("/people/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex max-h-[calc(100vh-5rem)] min-h-0 flex-1 flex-col">
      <PeopleList />
    </div>
  );
}
