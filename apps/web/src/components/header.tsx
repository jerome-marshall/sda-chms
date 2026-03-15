import { type AnyRouteMatch, Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  const { breadcrumbs, headerActions } = useHeaderData();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator
        className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
        orientation="vertical"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <Fragment key={`${crumb.path}-${crumb.label}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={() => <Link to={crumb.path}>{crumb.label}</Link>}
                    />
                  )}
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

/**
 * Breadcrumb label for a route — a static string, multiple labels for multi-segment
 * routes, or a function that resolves dynamically from loaderData at runtime.
 */
export type BreadcrumbValue =
  | string
  | string[]
  | ((match: AnyRouteMatch) => string | string[]);

interface ResolvedBreadcrumbItem {
  path: string;
  label: string;
}

/** Derives breadcrumbs from the current URL path and resolves dynamic labels from route loaderData. */
const useHeaderData = () => {
  const matches = useMatches();

  // Only routes that declare staticData.breadcrumb contribute a crumb
  const breadcrumbs: ResolvedBreadcrumbItem[] = matches.flatMap((match) => {
    const staticData = match.staticData;
    if (!staticData?.breadcrumb) {
      return [];
    }

    const resolved =
      typeof staticData.breadcrumb === "function"
        ? staticData.breadcrumb(match)
        : staticData.breadcrumb;

    // Array form lets a single route contribute multiple crumb segments
    const labels = Array.isArray(resolved) ? resolved : [resolved];

    return labels.map((item) => ({
      label: item,
      path: match.pathname,
    }));
  });

  // Header actions belong to the active leaf route only, not ancestors
  const leafMatch = matches.at(-1);
  const headerActions = leafMatch?.staticData?.headerActions ?? [];

  return { breadcrumbs, headerActions };
};
