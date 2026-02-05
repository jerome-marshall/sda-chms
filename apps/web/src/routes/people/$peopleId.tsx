import { createFileRoute } from "@tanstack/react-router";
import { apiClient, fetchApi } from "@/lib/api";

export const Route = createFileRoute("/people/$peopleId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const person = await fetchApi(
      apiClient.people[":id"].$get({ param: { id: params.peopleId } })
    );
    return person;
  },
});

function RouteComponent() {
  const person = Route.useLoaderData();
  return <div>{person.fullName}</div>;
}
