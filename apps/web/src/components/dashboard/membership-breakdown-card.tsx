import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Baby, Droplet } from "lucide-react";
import { queryOptions } from "@/lib/query";
import { getPeopleStats, isDeceased } from "@/utils/people";
import { DashboardCard } from "./dashboard-card";

interface StatusRowProps {
  color: string;
  label: string;
  count: number;
}

/** A single labeled row in the membership status breakdown list. */
function StatusRow({ color, label, count }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-foreground/80 text-sm">{label}</span>
      </div>
      <span className="font-semibold text-foreground text-sm tabular-nums">
        {count}
      </span>
    </div>
  );
}

const membershipIcon = (
  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600">
    <Activity className="h-6 w-6" />
  </div>
);

/** Stats grid showing baptized/unbaptized counts and a breakdown by membership status. */
export function MembershipBreakdownCard() {
  const { data: people } = useSuspenseQuery({
    ...queryOptions.people(),
    select: (data) => data.filter((person) => !isDeceased(person)),
  });

  const membershipStats = getPeopleStats(people);

  return (
    <DashboardCard
      contentClassName="space-y-8 p-6"
      description="Baptism & Status"
      icon={membershipIcon}
      title="Membership Breakdown"
    >
      {/* Top Grid: Baptized vs Unbaptized */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-between rounded-xl bg-blue-500/5 p-4 ring-1 ring-blue-500/20">
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Droplet className="h-4 w-4" />
            <span className="font-semibold text-xs uppercase tracking-wider">
              Baptized
            </span>
          </div>
          <p className="font-semibold text-3xl text-foreground/90 tabular-nums tracking-tight">
            {membershipStats.totalBaptized}
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
          <div className="mb-2 flex items-center gap-2 text-amber-600">
            <Baby className="h-4 w-4" />
            <span className="font-semibold text-xs uppercase tracking-wider">
              Unbaptized
            </span>
          </div>
          <p className="font-semibold text-3xl text-foreground/90 tabular-nums tracking-tight">
            {membershipStats.totalUnbaptized}
          </p>
        </div>
      </div>

      {/* Bottom List: Status Breakdown */}
      <div className="space-y-4">
        <h4 className="border-border/40 border-b pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          By Status
        </h4>
        <div className="space-y-3">
          <StatusRow
            color="var(--color-chart-1)"
            count={membershipStats.totalActiveMembers}
            label="Member"
          />
          <StatusRow
            color="var(--color-chart-2)"
            count={membershipStats.totalInactiveMembers}
            label="Inactive"
          />
          <StatusRow
            color="var(--color-chart-3)"
            count={membershipStats.totalInactiveMembers}
            label="Moved"
          />
        </div>
      </div>
    </DashboardCard>
  );
}
