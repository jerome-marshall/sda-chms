import { createFileRoute } from "@tanstack/react-router";
import { Home, TrendingUp, UserCheck, Users } from "lucide-react";
import { Suspense } from "react";
import { AgeGroupChart } from "@/components/dashboard/age-group-chart";
import { CelebrationsCard } from "@/components/dashboard/celebrations-card";
import { DashboardCardSkeleton } from "@/components/dashboard/dashboard-card";
import { ImportantDatesCard } from "@/components/dashboard/important-dates-card";
import { MembershipBreakdownCard } from "@/components/dashboard/membership-breakdown-card";
import { MemorialWatchCard } from "@/components/dashboard/memorial-watch-card";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { useHouseholds } from "@/hooks/data/use-households";
import { usePeople } from "@/hooks/data/use-people";
import { queryOptions } from "@/lib/query";
import { getPeopleStats } from "@/utils/people";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(queryOptions.people());
    queryClient.prefetchQuery(queryOptions.groups());
  },
});

function DashboardPage() {
  const { data: people, isLoading: isLoadingPeople } = usePeople();
  const peopleStats = getPeopleStats(people || []);
  const { data: households, isLoading: isLoadingHouseholds } = useHouseholds();

  return (
    <div className="container mx-auto space-y-6">
      <div className="mb-8 flex flex-col space-y-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your church community.
        </p>
      </div>

      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingPeople ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Total Members"
            trendDirection="up"
            value={peopleStats.totalPeople}
          />
        )}

        {isLoadingHouseholds && !households ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={<Home className="h-6 w-6" />}
            label="Total Families"
            trendDirection="up"
            value={households?.length || 0}
          />
        )}

        {isLoadingPeople ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            icon={<UserCheck className="h-6 w-6" />}
            label="Active Members"
            trendDirection="neutral"
            value={peopleStats.totalActiveMembers}
          />
        )}

        {isLoadingPeople ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            className="bg-primary/5 ring-primary/20"
            icon={<TrendingUp className="h-6 w-6" />}
            label="New This Quarter"
            trendDirection="up"
            value={peopleStats.totalNewMembers}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<DashboardCardSkeleton rows={6} />}>
          <CelebrationsCard />
        </Suspense>

        <ImportantDatesCard />

        <Suspense fallback={<DashboardCardSkeleton rows={6} />}>
          <MemorialWatchCard />
        </Suspense>

        <AgeGroupChart />

        <MembershipBreakdownCard />
      </div>
    </div>
  );
}
