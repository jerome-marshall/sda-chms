import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

// import { scan } from "react-scan"; // must be imported before React and React DOM

import Loader from "./components/loader";
import { apiClient } from "./lib/api";
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
    apiClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
