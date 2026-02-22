import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
