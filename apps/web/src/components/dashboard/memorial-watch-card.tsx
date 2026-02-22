import { Flower2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardCard } from "./dashboard-card";
import { MOCK_MEMORIALS } from "./mock-data";

const memorialIcon = (
  <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-500">
    <Flower2 className="h-6 w-6" />
  </div>
);

/** List of members with memorial dates falling this week. */
export function MemorialWatchCard() {
  return (
    <DashboardCard
      description="This Week"
      icon={memorialIcon}
      title="Memorial Watch"
    >
      <ScrollArea className="h-[354px]">
        {MOCK_MEMORIALS.length > 0 ? (
          <div className="divide-y divide-border/30">
            {MOCK_MEMORIALS.map((memorial) => (
              <div
                className="group relative flex items-center overflow-hidden p-6 transition-colors hover:bg-muted/40"
                key={memorial.id}
              >
                <div className="z-10 flex min-w-[200px] items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground/90 text-sm leading-none">
                      {memorial.lovedOneName}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="rounded bg-secondary px-1.5 font-medium text-foreground/80">
                        {memorial.date}
                      </span>
                      <span>
                        {memorial.yearsSince}{" "}
                        {memorial.yearsSince === 1 ? "Year" : "Years"} ago
                      </span>
                    </p>
                  </div>
                </div>

                <div className="z-10 flex w-fit items-center gap-2 rounded-md bg-background/60 p-2 ring-1 ring-border/50">
                  <Avatar className="h-6 w-6 border border-border/50">
                    <AvatarFallback className="bg-primary/5 font-medium text-[10px]">
                      {memorial.memberName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-muted-foreground text-xs">
                    Remembering with{" "}
                    <span className="font-medium text-foreground/80">
                      {memorial.memberName}
                    </span>
                  </p>
                </div>

                {/* Decorative background flower for subtle depth on hover */}
                <div className="absolute -right-4 -bottom-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <Flower2 className="h-20 w-20 text-indigo-500" />
                </div>
              </div>
            ))}
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
