import { Link, useRouter } from "@void/react";
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** One breadcrumb: a label, plus a link target when it is not the current page. */
export interface Crumb {
  label: string;
  path?: string;
}

const OverrideContext = createContext<Crumb[] | null>(null);
const SetOverrideContext = createContext<
  ((items: Crumb[] | null) => void) | null
>(null);

/** Above the header in the layout so one page at a time can override the trail. */
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Crumb[] | null>(null);
  return (
    <OverrideContext.Provider value={override}>
      <SetOverrideContext.Provider value={setOverride}>
        {children}
      </SetOverrideContext.Provider>
    </OverrideContext.Provider>
  );
}

/** A page names its trail from loader data; the header shows it after mount. */
export function useBreadcrumbs(items: Crumb[]) {
  const setOverride = useContext(SetOverrideContext);
  useEffect(() => {
    setOverride?.(items);
    return () => setOverride?.(null);
  }, [items, setOverride]);
}

const KNOWN_LABELS: Record<string, string> = {
  people: "People",
  add: "Add",
  edit: "Edit",
};

/** Fallback trail from the URL path, used for the server render before a page overrides it. */
const trailFromPath = (path: string): Crumb[] => {
  const segments = path.split("?")[0]?.split("/").filter(Boolean) ?? [];
  if (segments.length === 0) {
    return [{ label: "Home" }];
  }
  return segments.map((segment, index) => {
    const label =
      KNOWN_LABELS[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;
    return isLast
      ? { label }
      : { label, path: `/${segments.slice(0, index + 1).join("/")}` };
  });
};

export default function Header() {
  const router = useRouter();
  const override = useContext(OverrideContext);
  const breadcrumbs = useMemo(
    () => override ?? trailFromPath(router.path),
    [override, router.path]
  );

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
              <Fragment key={`${crumb.path ?? ""}-${crumb.label}`}>
                <BreadcrumbItem>
                  {isLast || !crumb.path ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={() => (
                        <Link href={crumb.path ?? "/"}>{crumb.label}</Link>
                      )}
                    />
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
