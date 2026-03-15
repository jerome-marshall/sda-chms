import {
  type AnyRouteMatch,
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";
import { queryOptions } from "@/lib/query";

export const Route = createFileRoute("/people/$peopleId")({
  component: RouteComponent,
  // Loads person data at the parent level so both detail and edit pages can use it
  loader: async ({ params, context: { queryClient } }) => {
    const person = await queryClient.ensureQueryData(
      queryOptions.person(params.peopleId)
    );
    return { person };
  },
  staticData: {
    breadcrumb: (match: AnyRouteMatch) => {
      const person = match.loaderData?.person;
      return person?.fullName ?? "Person";
    },
  },
});

function RouteComponent() {
  return <Outlet />;
}
