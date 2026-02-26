import { useSuspenseQuery } from "@tanstack/react-query";
import { Users2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { queryOptions } from "@/lib/query";
import { isDeceased } from "@/utils/people";
import { DashboardCard } from "./dashboard-card";

/** Broader demographic buckets (distinct from Sabbath School classes in shared constants). */
const AGE_GROUPS = [
  { label: "0–12", min: 0, max: 12 },
  { label: "13–17", min: 13, max: 17 },
  { label: "18–35", min: 18, max: 35 },
  { label: "36–59", min: 36, max: 59 },
  { label: "60+", min: 60, max: Number.POSITIVE_INFINITY },
] as const;

const ageGroupIcon = (
  <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
    <Users2 className="h-6 w-6" />
  </div>
);

/** Bar chart of member counts broken down by age group. */
export function AgeGroupChart() {
  const { data: people } = useSuspenseQuery({
    ...queryOptions.people(),
    select: (data) => data.filter((person) => !isDeceased(person)),
  });

  const chartData = AGE_GROUPS.map(({ label, min, max }) => ({
    group: label,
    count: people.filter(
      (person) =>
        person.age !== undefined &&
        person.age !== null &&
        person.age >= min &&
        person.age <= max
    ).length,
  }));

  const chartConfig = {
    count: {
      label: "Members",
      color: "var(--color-chart-1)",
    },
  };

  return (
    <DashboardCard
      contentClassName="p-6"
      description="Members by Age Group"
      icon={ageGroupIcon}
      title="Age Distribution"
    >
      <ChartContainer className="h-[250px] w-full" config={chartConfig}>
        <BarChart
          data={chartData}
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
