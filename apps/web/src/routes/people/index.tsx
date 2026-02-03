import { createFileRoute } from "@tanstack/react-router";
import PeopleList from "@/components/people/people-list";

export const Route = createFileRoute("/people/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <PeopleList />
    </div>
  );
}
