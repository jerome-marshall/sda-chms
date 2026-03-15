import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import PersonDetail from "@/components/people/person-detail";
import { queryOptions } from "@/lib/query";

export const Route = createFileRoute("/people/$peopleId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { peopleId } = Route.useParams();
  const { data: person } = useQuery(queryOptions.person(peopleId));

  // Data is guaranteed by the parent route loader; null guard handles stale cache edge cases
  if (!person) {
    return null;
  }

  return <PersonDetail person={person} />;
}
