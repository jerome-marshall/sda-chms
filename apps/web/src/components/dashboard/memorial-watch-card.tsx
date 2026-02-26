import { useSuspenseQuery } from "@tanstack/react-query";
import { Flower2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryOptions } from "@/lib/query";
import { isDeceased } from "@/utils/people";
import { DashboardCard } from "./dashboard-card";

const memorialIcon = (
  <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-500">
    <Flower2 className="h-6 w-6" />
  </div>
);

/** List of deceased people whose memorial day falls within the current week. */
export function MemorialWatchCard() {
  const { data: people } = useSuspenseQuery({
    ...queryOptions.people(),
    // Only deceased people can have a meaningful memorial day
    select: (data) => data.filter((person) => isDeceased(person)),
  });

  const memorialDaysThisWeek = people.filter((person) => {
    if (!person.memorialDay) {
      return false;
    }

    const today = new Date();

    // Week boundaries: Sunday 00:00 → Saturday 23:59
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Project the memorial date into the current year to check the anniversary
    const memorial = new Date(person.memorialDay);
    const memorialThisYear = new Date(
      today.getFullYear(),
      memorial.getMonth(),
      memorial.getDate()
    );

    return memorialThisYear >= startOfWeek && memorialThisYear <= endOfWeek;
  });

  return (
    <DashboardCard
      description="This Week"
      icon={memorialIcon}
      title="Memorial Watch"
    >
      <ScrollArea className="h-[354px]">
        {memorialDaysThisWeek.length > 0 ? (
          <div className="divide-y divide-border/30">
            {memorialDaysThisWeek.map((person) => {
              // Years elapsed since the memorial, shown as a human-readable label
              const yearsSince =
                new Date().getFullYear() -
                new Date(person.memorialDay as string).getFullYear();

              return (
                <div
                  className="group relative flex items-center justify-between overflow-hidden p-6 transition-colors hover:bg-muted/40"
                  key={person.fullName + person.memorialDay}
                >
                  <div className="z-10 flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-border/50 ring-2 ring-transparent transition-all group-hover:ring-primary/10">
                      <AvatarFallback className="bg-primary/5 font-medium text-primary text-sm">
                        {person.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none transition-colors group-hover:text-primary">
                        {person.fullName}
                      </p>
                      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <span className="font-semibold text-foreground/70 tabular-nums">
                          {person.memorialDay}
                        </span>
                        <span className="text-border">•</span>
                        <span>
                          {yearsSince} {yearsSince === 1 ? "Year" : "Years"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Decorative background flower for subtle depth on hover */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 transition-opacity group-hover:opacity-10">
                    <Flower2 className="h-20 w-20 text-indigo-500" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <Flower2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">No memorials this week</p>
              <p className="max-w-[200px] text-muted-foreground text-xs">
                Take a moment to check in on members who might need support.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </DashboardCard>
  );
}
