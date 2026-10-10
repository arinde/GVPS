"use client";

import Link from "next/link";
import { ResultsSummary } from "@/components/results/results-summary";
import { useGetStudentResultsQuery } from "@/store/api/results-api";

export type StudentResultsCardProps = { studentId: string };

/**
 * Rendered only for roles the API actually lets see results at all
 * (StudentResultsService); this card trusts that gate rather than repeating it.
 */
export function StudentResultsCard({ studentId }: StudentResultsCardProps) {
  const { data, isLoading } = useGetStudentResultsQuery(studentId);
  return (
    <div className="flex flex-col gap-3">
      <ResultsSummary data={data} isLoading={isLoading} caption="Live scores, not yet approved or published." />
      {data?.term ? (
        <Link
          href={`/results/report-cards/${data.term.id}/${studentId}`}
          className="text-primary self-start text-sm font-semibold underline-offset-4 hover:underline"
        >
          Open this term&apos;s report card
        </Link>
      ) : null}
    </div>
  );
}
