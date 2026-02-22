import { createFileRoute } from "@tanstack/react-router";
import { Home, TrendingUp, UserCheck, Users } from "lucide-react";
import { AgeGroupChart } from "@/components/dashboard/age-group-chart";
import { CelebrationsCard } from "@/components/dashboard/celebrations-card";
import { ImportantDatesCard } from "@/components/dashboard/important-dates-card";
import { MembershipBreakdownCard } from "@/components/dashboard/membership-breakdown-card";
import { MemorialWatchCard } from "@/components/dashboard/memorial-watch-card";
import { MOCK_MEMBERSHIP_STATS } from "@/components/dashboard/mock-data";
import { StatCard } from "@/components/dashboard/stat-card";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="fade-in slide-in-from-bottom-4 container mx-auto animate-in space-y-6 p-4 duration-500 md:p-6">
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
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Members"
          trend="2%"
          trendDirection="up"
          value={MOCK_MEMBERSHIP_STATS.totalMembers}
        />
        <StatCard
          icon={<Home className="h-6 w-6" />}
          label="Total Families"
          trend="1%"
          trendDirection="up"
          value={MOCK_MEMBERSHIP_STATS.totalFamilies}
        />
        <StatCard
          icon={<UserCheck className="h-6 w-6" />}
          label="Active Members"
          trend="Stable"
          trendDirection="neutral"
          value={MOCK_MEMBERSHIP_STATS.activeCount}
        />
        <StatCard
          className="bg-primary/5 ring-primary/20"
          icon={<TrendingUp className="h-6 w-6" />}
          label="New This Quarter"
          trend="5%"
          trendDirection="up"
          value={MOCK_MEMBERSHIP_STATS.newThisQuarter}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CelebrationsCard />
        <ImportantDatesCard />
        <MemorialWatchCard />
        <AgeGroupChart />
        <MembershipBreakdownCard />
      </div>
    </div>
  );
}
