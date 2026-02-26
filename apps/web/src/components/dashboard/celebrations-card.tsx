import { useSuspenseQuery } from "@tanstack/react-query";
import { Cake, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryOptions } from "@/lib/query";
import { isDeceased } from "@/utils/people";
import { Badge } from "../ui/badge";
import { DashboardCard } from "./dashboard-card";

const celebrationsIcon = (
  <>
    <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-500">
      <Cake className="h-6 w-6" />
    </div>
    <div className="rounded-lg bg-rose-500/10 p-2.5 text-rose-500">
      <Heart className="h-6 w-6" />
    </div>
  </>
);

/** Scrollable list of birthdays and anniversaries occurring this month. */
export function CelebrationsCard() {
  // Deceased people are excluded from celebrations per domain rules
  const { data: people } = useSuspenseQuery({
    ...queryOptions.people(),
    select: (data) => data.filter((person) => !isDeceased(person)),
  });

  const currentMonth = new Date().getMonth();

  const birthdaysThisMonth = people
    .map((person) => {
      if (person.dateOfBirth) {
        return {
          name: person.fullName,
          date: person.dateOfBirth,
          years: person.age,
          type: "birthday",
        } as const;
      }
      return null;
    })
    .filter(Boolean)
    .filter((birthday) => new Date(birthday.date).getMonth() === currentMonth);

  const anniversariesThisMonth = people
    .map((person) => {
      if (person.weddingDate) {
        return {
          name: person.fullName,
          date: person.weddingDate,
          // Years married = current year minus the wedding year
          years:
            new Date().getFullYear() -
            new Date(person.weddingDate).getFullYear(),
          type: "anniversary",
        } as const;
      }
      return null;
    })
    .filter(Boolean)
    .filter(
      (anniversary) => new Date(anniversary.date).getMonth() === currentMonth
    );

  const celebrations = [...birthdaysThisMonth, ...anniversariesThisMonth].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <DashboardCard
      description="This Month"
      icon={celebrationsIcon}
      title="Celebrations"
    >
      <ScrollArea className="h-[354px]">
        <div className="divide-y divide-border/30">
          {celebrations.map((celebration) => (
            <div
              className="group relative flex items-center justify-between overflow-hidden p-6 transition-colors hover:bg-muted/40"
              key={celebration.name + celebration.date}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border/50 ring-2 ring-transparent transition-all group-hover:ring-primary/10">
                  <AvatarFallback className="bg-primary/5 font-medium text-primary text-sm">
                    {celebration.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium text-sm leading-none transition-colors group-hover:text-primary">
                    {celebration.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Badge
                      className={`px-2 py-0.5 font-semibold text-[10px] capitalize tracking-wider ${
                        celebration.type === "birthday"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                      variant="secondary"
                    >
                      <span className="flex items-center gap-1">
                        {celebration.type === "birthday" ? (
                          <Cake className="h-3 w-3" />
                        ) : (
                          <Heart className="h-3 w-3" />
                        )}
                        <span className="leading-none">{celebration.type}</span>
                      </span>
                    </Badge>
                    <span className="text-border">•</span>
                    <span className="font-semibold text-foreground/70 tabular-nums">
                      {celebration.date}
                    </span>

                    <span className="text-border">•</span>
                    <span>
                      {celebration.type === "birthday"
                        ? `Turns ${celebration.years}`
                        : `${celebration.years} Years`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Decorative background icon for subtle depth on hover */}
              <div className="absolute -right-4 -bottom-4 opacity-5 transition-opacity group-hover:opacity-10">
                {celebration.type === "birthday" ? (
                  <Cake className="h-20 w-20 text-amber-500" />
                ) : (
                  <Heart className="h-20 w-20 text-rose-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashboardCard>
  );
}
