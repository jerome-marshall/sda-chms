import { Link, useLocation } from "@tanstack/react-router";
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

const BREADCRUMBS_CONFIG: Record<TRoutes, string> = {
  "/": "Home",
  "/people": "People",
  "/people/add": "Add Person",
  "/example": "Example",
};

const HEADER_ACTIONS_CONFIG: Record<TRoutes, ReactElement[]> = {
  "/": [],
  "/people": [
    <Link className={cn(buttonVariants())} key="add-person" to="/people/add">
      Add Person
    </Link>,
  ],
  "/people/add": [],
  "/example": [],
};

const useHeaderData = () => {
  const { pathname } = useLocation();

  // Build breadcrumbs from path segments
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = [{ label: "Home", path: "/" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    // Try to find a matching route config (with or without trailing slash)
    const label =
      BREADCRUMBS_CONFIG[currentPath as TRoutes] ||
      segment.charAt(0).toUpperCase() + segment.slice(1); // Fallback: capitalize segment

    breadcrumbs.push({ label, path: currentPath });
  }

  const headerActions = HEADER_ACTIONS_CONFIG[pathname as TRoutes] || [];

  return { breadcrumbs, headerActions };
};
