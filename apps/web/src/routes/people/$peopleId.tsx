import { createFileRoute } from "@tanstack/react-router";
import PersonDetail from "@/components/people/person-detail";
import { fetchApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export const Route = createFileRoute("/people/$peopleId")({
  component: RouteComponent,
  // Pre-fetches person data before rendering so the detail page loads instantly
  loader: async ({ params, context: { queryClient, apiClient } }) => {
    const person = await queryClient.ensureQueryData({
      queryKey: queryKeys.person(params.peopleId),
      queryFn: () =>
        fetchApi(
          apiClient.people[":id"].$get({ param: { id: params.peopleId } })
        ),
    });

    return person;
  },
});

function RouteComponent() {
  const person = Route.useLoaderData();
  return <PersonDetail person={person} />;
}
