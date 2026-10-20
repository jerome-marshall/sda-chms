import { Home, TrendingUp, UserCheck, Users } from "lucide-react";
import { useMemo } from "react";

import { AgeGroupChart } from "@/components/dashboard/age-group-chart";
import { CelebrationsCard } from "@/components/dashboard/celebrations-card";
import { ImportantDatesCard } from "@/components/dashboard/important-dates-card";
import { MembershipBreakdownCard } from "@/components/dashboard/membership-breakdown-card";
import { MemorialWatchCard } from "@/components/dashboard/memorial-watch-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { useBreadcrumbs } from "@/components/header";
import { getPeopleStats } from "@/utils/people";

import type { Props } from "./index.server";

export default function DashboardPage({ people, households }: Props) {
  const crumbs = useMemo(() => [{ label: "Home" }], []);
  useBreadcrumbs(crumbs);

  const peopleStats = getPeopleStats(people ?? []);

  return (
    <div className="container mx-auto space-y-6">
      <div className="mb-8 flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your church community.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Members"
          trendDirection="up"
          value={peopleStats.totalPeople}
        />
        <StatCard
          icon={<Home className="h-6 w-6" />}
          label="Total Families"
          trendDirection="up"
          value={households?.length ?? 0}
        />
        <StatCard
          icon={<UserCheck className="h-6 w-6" />}
          label="Active Members"
          trendDirection="neutral"
          value={peopleStats.totalActiveMembers}
        />
        <StatCard
          className="bg-primary/5 ring-primary/20"
          icon={<TrendingUp className="h-6 w-6" />}
          label="New This Quarter"
          trendDirection="up"
          value={peopleStats.totalNewMembers}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CelebrationsCard people={people ?? []} />
        <ImportantDatesCard people={people ?? []} />
        <MemorialWatchCard people={people ?? []} />
        <AgeGroupChart people={people ?? []} />
        <MembershipBreakdownCard people={people ?? []} />
      </div>
    </div>
  );
}
