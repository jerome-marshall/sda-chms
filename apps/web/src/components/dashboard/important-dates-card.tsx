import { CalendarHeart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "../ui/badge";
import { DashboardCard } from "./dashboard-card";
import { MOCK_IMPORTANT_DATES } from "./mock-data";

const importantDatesIcon = (
  <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-500">
    <CalendarHeart className="h-6 w-6" />
  </div>
);

function getDaysLabel(daysUntil: number): string {
  if (daysUntil === 0) {
    return "Today";
  }
  if (daysUntil === 1) {
    return "Tomorrow";
  }
  return `In ${daysUntil} days`;
}

/** Scrollable list of member-specific important dates occurring this week. */
export function ImportantDatesCard() {
  return (
    <DashboardCard
      description="This Week"
      icon={importantDatesIcon}
      title="Important Dates"
    >
      <ScrollArea className="h-[354px]">
        {MOCK_IMPORTANT_DATES.length > 0 ? (
          <div className="divide-y divide-border/30">
            {MOCK_IMPORTANT_DATES.map((entry) => (
              <div
                className="group relative flex items-center justify-between overflow-hidden p-6 transition-colors hover:bg-muted/40"
                key={entry.id}
              >
                <div className="z-10 flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-border/50 ring-2 ring-transparent transition-all group-hover:ring-primary/10">
                    <AvatarFallback className="bg-primary/5 font-medium text-primary text-sm">
                      {entry.memberName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-none transition-colors group-hover:text-primary">
                      {entry.memberName}
                    </p>
                    <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Badge
                        className="bg-teal-100 px-2 py-0.5 font-semibold text-[10px] text-teal-700 capitalize tracking-wider"
                        variant="secondary"
                      >
                        <span className="flex items-center gap-1">
                          {/* <CalendarHeart className="h-3 w-3" /> */}
                          <span className="leading-none">{entry.occasion}</span>
                        </span>
                      </Badge>
                      <span className="text-border">•</span>
                      <span className="font-semibold text-foreground/70 tabular-nums">
                        {entry.date}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className={`z-10 shrink-0 rounded-full px-2.5 py-1 font-semibold text-[11px] tabular-nums ${
                    entry.daysUntil === 0
                      ? "bg-teal-500/10 text-teal-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getDaysLabel(entry.daysUntil)}
                </span>

                {/* Decorative background icon for subtle depth on hover */}
                <div className="absolute -right-4 -bottom-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <CalendarHeart className="h-20 w-20 text-teal-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <CalendarHeart className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">
                No important dates this week
              </p>
              <p className="max-w-[200px] text-muted-foreground text-xs">
                Dates to remember will appear here as they approach.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </DashboardCard>
  );
}
