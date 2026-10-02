"use client";

import { ResultsSummary } from "@/components/results/results-summary";
import { useGetStudentResultsQuery } from "@/store/api/results-api";

export type StudentResultsCardProps = { studentId: string };

/**
 * Rendered only for roles the API actually lets see results at all
 * (StudentResultsService); this card trusts that gate rather than repeating it.
 */
export function StudentResultsCard({ studentId }: StudentResultsCardProps) {
  const { data, isLoading } = useGetStudentResultsQuery(studentId);
  return <ResultsSummary data={data} isLoading={isLoading} />;
}
