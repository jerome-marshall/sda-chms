import { createFileRoute, Outlet } from "@tanstack/react-router";

import { queryOptions } from "@/lib/query";

export const Route = createFileRoute("/people")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    // Prefetch failures resolve through the components' own queries.
    void queryClient.query(queryOptions.people()).catch(() => {
      // Components refetch on mount, so a failed prefetch is harmless.
    });
  },
  staticData: {
    breadcrumb: "People",
  },
});

function RouteComponent() {
  return <Outlet />;
}
