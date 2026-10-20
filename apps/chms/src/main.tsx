import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
// import { scan } from "react-scan"; // must be imported before React and React DOM

import type { BreadcrumbValue } from "./components/header";
import Loader from "./components/loader";
import { queryClient } from "./lib/query";
import { routeTree } from "./routeTree.gen";

// scan({
//   enabled: true,
// });

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  /** Extends TanStack Router's static data with app-level header conventions. */
  interface StaticDataRouteOption {
    breadcrumb?: BreadcrumbValue;
    headerActions?: React.ReactNode[];
  }
}

const rootElement = document.querySelector("#app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
