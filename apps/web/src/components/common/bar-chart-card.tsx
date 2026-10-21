"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ContentCard } from "@/components/common/content-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type BarChartCardProps = {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  /** The key in `data` each bar's label comes from — "name", "letter", etc. */
  categoryKey: string;
  /** The key in `data` each bar's height comes from. */
  valueKey: string;
  valueLabel: string;
  /** e.g. a "%" or "₦" suffix/prefix for the tooltip and axis. */
  formatValue?: (value: number) => string;
};

/** One bar per category — subject averages, grade counts, enrolment by level. Presentational only (AGENTS.md §1). */
export function BarChartCard({
  title,
  subtitle,
  data,
  categoryKey,
  valueKey,
  valueLabel,
  formatValue,
}: BarChartCardProps) {
  const config: ChartConfig = { [valueKey]: { label: valueLabel, color: "var(--chart-1)" } };

  return (
    <ContentCard>
      <h2 className="text-base">{title}</h2>
      {subtitle ? <p className="text-muted-foreground mb-3 text-xs">{subtitle}</p> : null}
      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
      ) : (
        <ChartContainer config={config} className="mt-2 max-h-72 w-full">
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value: number) => (formatValue ? formatValue(value) : String(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (formatValue ? formatValue(Number(value)) : String(value))}
                />
              }
            />
            <Bar dataKey={valueKey} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ContentCard>
  );
}
