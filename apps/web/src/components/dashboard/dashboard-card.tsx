import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  /** One or more icon elements rendered to the left of the title. */
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

interface DashboardCardSkeletonProps {
  /** Number of placeholder rows to render in the content area. */
  rows?: number;
  className?: string;
}

/** Loading placeholder that mirrors the DashboardCard layout — header + stacked content rows. */
export function DashboardCardSkeleton({
  rows = 4,
  className,
}: DashboardCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-0 overflow-hidden bg-background/50 pb-0 shadow-sm ring-1 ring-border/50",
        className
      )}
    >
      <CardHeader className="gap-0 border-border/40 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-3 w-20 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="divide-y divide-border/40">
          {Array.from({ length: rows }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows have no meaningful key
            <div className="flex items-center gap-3 px-4 py-3" key={i}>
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 rounded-sm" />
                <Skeleton className="h-3 w-1/2 rounded-sm" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Shared card shell used by all dashboard widgets — consistent header layout with title/description on the left and icon(s) on the right. */
export function DashboardCard({
  title,
  description,
  icon,
  children,
  className,
  contentClassName,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-0 overflow-hidden bg-background/50 pb-0 shadow-sm ring-1 ring-border/50",
        className
      )}
    >
      <CardHeader className="gap-0 border-border/40 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
            <CardDescription className="font-medium text-xs uppercase tracking-wider">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className={cn("flex-1 p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
