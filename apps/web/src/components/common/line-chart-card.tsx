"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ContentCard } from "@/components/common/content-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type LineChartCardProps = {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  categoryKey: string;
  valueKey: string;
  valueLabel: string;
  formatValue?: (value: number) => string;
};

/** A trend over time — attendance rate day by day. Presentational only (AGENTS.md §1). */
export function LineChartCard({
  title,
  subtitle,
  data,
  categoryKey,
  valueKey,
  valueLabel,
  formatValue,
}: LineChartCardProps) {
  const config: ChartConfig = { [valueKey]: { label: valueLabel, color: "var(--chart-1)" } };

  return (
    <ContentCard>
      <h2 className="text-base">{title}</h2>
      {subtitle ? <p className="text-muted-foreground mb-3 text-xs">{subtitle}</p> : null}
      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
      ) : (
        <ChartContainer config={config} className="mt-2 max-h-72 w-full">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              domain={[0, 100]}
              tickFormatter={(value: number) => (formatValue ? formatValue(value) : String(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (formatValue ? formatValue(Number(value)) : String(value))}
                />
              }
            />
            <Line type="monotone" dataKey={valueKey} stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      )}
    </ContentCard>
  );
}
