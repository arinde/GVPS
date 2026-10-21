"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ContentCard } from "@/components/common/content-card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const SLICE_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export type PieChartCardProps = {
  title: string;
  subtitle?: string;
  data: { name: string; value: number }[];
};

/** A donut with a coloured legend — enrolment by sex, grade spread. Presentational only (AGENTS.md §1). */
export function PieChartCard({ title, subtitle, data }: PieChartCardProps) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const config: ChartConfig = Object.fromEntries(
    data.map((row, index) => [row.name, { label: row.name, color: SLICE_COLORS[index % SLICE_COLORS.length] }]),
  );

  return (
    <ContentCard>
      <h2 className="text-base">{title}</h2>
      {subtitle ? <p className="text-muted-foreground mb-3 text-xs">{subtitle}</p> : null}
      {total === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
      ) : (
        <ChartContainer config={config} className="mx-auto max-h-64 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} strokeWidth={2}>
              {data.map((row, index) => (
                <Cell key={row.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      )}
    </ContentCard>
  );
}
