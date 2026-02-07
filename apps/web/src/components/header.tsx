import { Link, useMatches } from "@tanstack/react-router";
import { Fragment, type ReactElement } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { TRoutes } from "@/types/route";

export default function Header() {
  const { breadcrumbs, headerActions } = useHeaderData();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
        orientation="vertical"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <Fragment key={breadcrumb.path}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className={cn(isLast && "pointer-events-none")}
                    render={
                      <Link disabled={isLast} to={breadcrumb.path as TRoutes}>
                        {breadcrumb.label}
                      </Link>
                    }
                  />
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {headerActions.length > 0 && (
        <div className="ml-auto">
          <ButtonGroup>{headerActions}</ButtonGroup>
        </div>
      )}
    </header>
  );
}

const HEADER_ACTIONS_CONFIG: Partial<Record<TRoutes, ReactElement[]>> = {
  "/people": [
    <Link className={cn(buttonVariants())} key="add-person" to="/people/add">
      Add Person
    </Link>,
  ],
};

// Static labels for known path segments
const SEGMENT_LABELS: Record<string, string> = {
  people: "People",
  add: "Add Person",
  example: "Example",
};

// Maps a route ID to a function that extracts a display name from its loaderData
const DYNAMIC_BREADCRUMB_LABELS: Record<
  TRoutes,
  (loaderData: Record<string, unknown>) => string
> = {
  "/": () => "Home",
  "/example": () => "Example",
  "/people": () => "People",
  "/people/add": () => "Add Person",
  "/people/$peopleId": (data) => (data.fullName as string) ?? "Person",
};

const useHeaderData = () => {
  const matches = useMatches();
  console.log("🚀 ~ useHeaderData ~ matches:", matches);

  // Use the deepest match's pathname to build breadcrumbs
  const currentMatch = matches.at(-1);
  const pathname = currentMatch?.pathname ?? "/";

  // Check if the current route has a dynamic breadcrumb label
  const dynamicLabelFn =
    currentMatch && currentMatch.routeId in DYNAMIC_BREADCRUMB_LABELS
      ? DYNAMIC_BREADCRUMB_LABELS[currentMatch.routeId as TRoutes]
      : undefined;

  // Build breadcrumbs from URL segments for the full hierarchy
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: "Home", path: "/" }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const isLastSegment = i === segments.length - 1;

    // For the last segment, use the dynamic label from loaderData if available
    if (isLastSegment && dynamicLabelFn && currentMatch?.loaderData) {
      breadcrumbs.push({
        label: dynamicLabelFn(currentMatch.loaderData),
        path: currentPath,
      });
    } else {
      const label =
        SEGMENT_LABELS[segment] ??
        segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({ label, path: currentPath });
    }
  }

  const headerActions = HEADER_ACTIONS_CONFIG[pathname as TRoutes] || [];

  return { breadcrumbs, headerActions };
};
