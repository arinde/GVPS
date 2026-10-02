"use client";

import { ResultsSummary } from "@/components/results/results-summary";
import { useGetPortalChildResultsQuery } from "@/store/api/portal-api";

export type PortalChildResultsCardProps = { studentId: string };

/** FEATURES.md §12: a parent's read-only view of their ward's current-term scores. */
export function PortalChildResultsCard({ studentId }: PortalChildResultsCardProps) {
  const { data, isLoading } = useGetPortalChildResultsQuery(studentId);
  return <ResultsSummary data={data} isLoading={isLoading} />;
}
