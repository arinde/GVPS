"use client";

import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { StatusPill } from "@/components/common/status-pill";
import { useGetStudentResultsQuery } from "@/store/api/results-api";

export type StudentResultsCardProps = { studentId: string };

/**
 * A live read of the current term's scores (FEATURES.md §5.3), not a report
 * card — the frozen, approved version (§5.5) shows here once Block 2 exists.
 * Rendered only for roles the API actually lets see results at all
 * (StudentResultsService); this card trusts that gate rather than repeating it.
 */
export function StudentResultsCard({ studentId }: StudentResultsCardProps) {
  const { data, isLoading } = useGetStudentResultsQuery(studentId);

  if (isLoading) {
    return (
      <ContentCard>
        <p className="text-muted-foreground text-sm" role="status">
          Loading results…
        </p>
      </ContentCard>
    );
  }

  if (!data?.term || data.subjects.length === 0) {
    return (
      <ContentCard>
        <h2 className="mb-3 text-base">Results</h2>
        <EmptyState
          title="No scores yet this term"
          description={data?.term ? `Nothing has been entered for ${data.term.name} yet.` : "No current term is set."}
        />
      </ContentCard>
    );
  }

  return (
    <ContentCard flush>
      <h2 className="px-5 pt-5 pb-1 text-base">Results — {data.term.name}</h2>
      <p className="text-muted-foreground px-5 pb-3 text-xs">Live scores, not yet approved or published.</p>
      <table className="w-full text-sm">
        <thead className="text-muted-foreground border-b text-left text-xs">
          <tr>
            <th className="px-5 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 font-medium">Total</th>
            <th className="px-3 py-2 font-medium">Grade</th>
          </tr>
        </thead>
        <tbody>
          {data.subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-b last:border-0">
              <td className="px-5 py-2.5">{subject.subjectName}</td>
              <td className="px-3 py-2.5">
                {subject.total}
                <span className="text-muted-foreground">/{subject.maxTotal}</span>
              </td>
              <td className="px-3 py-2.5">
                {subject.grade ? (
                  <StatusPill tone="info" shape="hollow">
                    {`${subject.grade.letter} — ${subject.grade.descriptor}`}
                  </StatusPill>
                ) : (
                  <span className="text-muted-foreground text-xs">Incomplete</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContentCard>
  );
}
