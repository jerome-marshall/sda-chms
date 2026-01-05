import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppLayout } from "@/components/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../index.css";
import { queryClient } from "@/lib/query";

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "sda-chms",
      },
      {
        name: "description",
        content: "sda-chms is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          storageKey="vite-ui-theme"
        >
          <AppLayout>
            <Outlet />
          </AppLayout>
          <Toaster richColors />
        </ThemeProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
