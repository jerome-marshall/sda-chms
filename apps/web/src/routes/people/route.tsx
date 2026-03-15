import { createFileRoute, Outlet } from "@tanstack/react-router";
import { queryOptions } from "@/lib/query";

export const Route = createFileRoute("/people")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(queryOptions.people());
  },
  staticData: {
    breadcrumb: "People",
  },
});

function RouteComponent() {
  return <Outlet />;
}
