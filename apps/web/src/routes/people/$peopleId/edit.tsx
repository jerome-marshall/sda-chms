import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import EditPersonForm from "@/components/people/edit-person-form";
import { queryOptions } from "@/lib/query";

export const Route = createFileRoute("/people/$peopleId/edit")({
  component: RouteComponent,
  staticData: { breadcrumb: "Edit" },
  // ensureQueryData blocks navigation until data is ready, complementing the parent prefetch
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(queryOptions.person(params.peopleId));
  },
});

function RouteComponent() {
  const { peopleId } = Route.useParams();
  const { data: person } = useQuery(queryOptions.person(peopleId));

  if (!person) {
    return null;
  }

  return (
    <div>
      <EditPersonForm person={person} />
    </div>
  );
}
