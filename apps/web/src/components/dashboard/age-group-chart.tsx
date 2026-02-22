import { Users2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DashboardCard } from "./dashboard-card";
import { MOCK_MEMBERSHIP_STATS } from "./mock-data";

const ageGroupIcon = (
  <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
    <Users2 className="h-6 w-6" />
  </div>
);

/** Bar chart of member counts broken down by Sabbath School age group. */
export function AgeGroupChart() {
  const chartConfig = {
    count: {
      label: "Members",
      color: "var(--color-chart-1)",
    },
  };

  return (
    <DashboardCard
      contentClassName="p-6"
      description="Sabbath School Groups"
      icon={ageGroupIcon}
      title="Age Distribution"
    >
      <ChartContainer className="h-[250px] w-full" config={chartConfig}>
        <BarChart
          data={MOCK_MEMBERSHIP_STATS.byAgeGroup}
          margin={{ top: 10, right: 10, bottom: 20, left: -20 }}
        >
          <CartesianGrid
            className="opacity-10"
            stroke="currentColor"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            className="opacity-60"
            dataKey="group"
            dy={10}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            className="opacity-60"
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent indicator="dot" />}
            cursor={{ fill: "var(--color-primary)", opacity: 0.05 }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-chart-2)"
            maxBarSize={50}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </DashboardCard>
  );
}
