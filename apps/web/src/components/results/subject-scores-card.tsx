import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { LoadingState } from "@/components/common/spinner";
import type { SubjectScores } from "@/store/api/approval-api";

export type SubjectScoresCardProps = {
  subjectName: string;
  scores: SubjectScores | undefined;
  isLoading: boolean;
  onClose: () => void;
};

/** Read-only: the live scores a reviewer checks before marking a subject reviewed. */
export function SubjectScoresCard({ subjectName, scores, isLoading, onClose }: SubjectScoresCardProps) {
  return (
    <ContentCard flush>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-base">Scores: {subjectName}</h2>
        <AppButton type="button" variant="ghost" size="small" onClick={onClose}>
          Close
        </AppButton>
      </div>
      {isLoading || !scores ? (
        <LoadingState label="Loading scores…" className="px-5 pb-5" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-y text-left text-xs">
              <tr>
                <th className="px-5 py-2 font-medium">Student</th>
                {scores.components.map((component) => (
                  <th key={component.id} className="px-3 py-2 font-medium">
                    {component.name} <span className="text-muted-foreground">/{component.maxScore}</span>
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {scores.rows.map((row) => (
                <tr key={row.studentId} className="border-b last:border-0">
                  <td className="px-5 py-2.5">{row.name}</td>
                  {row.values.map((value) => (
                    <td key={value.componentId} className="px-3 py-2.5">
                      {value.value ?? <span className="text-danger-foreground font-semibold">blank</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ContentCard>
  );
}
