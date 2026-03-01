import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarHeart } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryOptions } from "@/lib/query";
import { isDeceased } from "@/utils/people";
import { Badge } from "../ui/badge";
import { DashboardCard } from "./dashboard-card";

interface ImportantDateEntry {
  id: string;
  memberName: string;
  occasion: string;
  date: string;
  daysUntil: number;
}

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

/** Whole-day difference between two dates; negative means `to` is in the past relative to `from`. */
function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Returns the number of days from `today` until the next occurrence of
 * a month+day pair (for yearly events) or until the exact date (one-time).
 * Returns null when the event falls outside "this week" (0–6 days away).
 */
function getDaysUntilThisWeek(
  dateStr: string,
  recurrence: "none" | "yearly",
  today: Date
): number | null {
  const eventDate = new Date(dateStr);
  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  const diff =
    recurrence === "yearly"
      ? getYearlyDaysUntil(eventDate, today)
      : daysBetween(today, eventDate);

  return diff >= 0 && diff <= 6 ? diff : null;
}

/**
 * Days until the next annual occurrence of `eventDate`'s month+day.
 * If the occurrence has already passed this calendar year, rolls over to next year.
 */
function getYearlyDaysUntil(eventDate: Date, today: Date): number {
  const thisYear = today.getFullYear();
  const occurrenceThisYear = new Date(
    thisYear,
    eventDate.getMonth(),
    eventDate.getDate()
  );
  const diff = daysBetween(today, occurrenceThisYear);
  if (diff >= 0) {
    return diff;
  }
  const occurrenceNextYear = new Date(
    thisYear + 1,
    eventDate.getMonth(),
    eventDate.getDate()
  );
  return daysBetween(today, occurrenceNextYear);
}

/** Builds the list of important date entries for a single person this week. */
function getEntriesForPerson(
  person: {
    id: string;
    fullName: string;
    baptismDate: string | null;
    importantDates:
      | { date: string; name: string; recurrence?: string }[]
      | null;
  },
  today: Date
): ImportantDateEntry[] {
  const results: ImportantDateEntry[] = [];

  if (person.baptismDate) {
    const daysUntil = getDaysUntilThisWeek(person.baptismDate, "yearly", today);
    if (daysUntil !== null) {
      results.push({
        id: `${person.id}-baptism`,
        memberName: person.fullName,
        occasion: "Baptism Anniversary",
        date: person.baptismDate,
        daysUntil,
      });
    }
  }

  for (const entry of person.importantDates ?? []) {
    const recurrence = entry.recurrence === "none" ? "none" : "yearly";
    const daysUntil = getDaysUntilThisWeek(entry.date, recurrence, today);
    if (daysUntil !== null) {
      results.push({
        id: `${person.id}-${entry.name}-${entry.date}`,
        memberName: person.fullName,
        occasion: entry.name,
        date: entry.date,
        daysUntil,
      });
    }
  }

  return results;
}

/** Scrollable list of member-specific important dates occurring this week. */
export function ImportantDatesCard() {
  const { data: people } = useSuspenseQuery({
    ...queryOptions.people(),
    select: (data) => data.filter((person) => !isDeceased(person)),
  });

  const entries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return people
      .flatMap((person) => getEntriesForPerson(person, today))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [people]);

  return (
    <DashboardCard
      description="This Week"
      icon={importantDatesIcon}
      title="Important Dates"
    >
      <ScrollArea className="h-[354px]">
        {entries.length > 0 ? (
          <div className="divide-y divide-border/30">
            {entries.map((entry) => (
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
                        className="bg-teal-100 px-2 py-0.5 font-semibold text-[10px] text-teal-700 capitalize leading-none tracking-wider"
                        variant="secondary"
                      >
                        {entry.occasion}
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
