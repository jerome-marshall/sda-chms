import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
}

/** Reusable stat card showing an icon, large value, label, and optional trend indicator. */
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendDirection = "up",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-background/50 py-0 shadow-sm ring-1 ring-border/50",
        className
      )}
    >
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="relative z-10 space-y-1">
            <p className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-4xl text-foreground tabular-nums tracking-tight">
                {value}
              </h3>
              {trend && (
                <span
                  className={cn(
                    "ml-1 font-medium text-xs",
                    trendDirection === "up" && "text-emerald-500",
                    trendDirection === "down" && "text-rose-500",
                    trendDirection === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trendDirection === "up" && "+"}
                  {trendDirection === "down" && "-"}
                  {trend}
                </span>
              )}
            </div>
          </div>
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>

        {/* Subtle decorative aura behind the icon for visual depth */}
        <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-1/3 -translate-y-1/2 rounded-full bg-primary/5 blur-2xl" />
      </CardContent>
    </Card>
  );
}
