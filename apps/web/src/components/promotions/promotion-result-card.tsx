import { CircleCheck } from "lucide-react";
import { ContentCard } from "@/components/common/content-card";
import type { PromotionResult } from "@/store/api/promotions-api";

/**
 * What the promotion did. New admission numbers are listed in full, because
 * they must be written onto each student's file — they are not shown again.
 */
export function PromotionResultCard({ result }: { result: PromotionResult }) {
  const reissued = result.students.filter((student) => student.newNo);

  return (
    <ContentCard className="flex flex-col gap-3">
      <div role="status" className="contents">
        <p className="flex items-center gap-2 text-base font-semibold">
          <CircleCheck className="text-success-foreground size-5" aria-hidden="true" />
          {result.promoted} student{result.promoted === 1 ? "" : "s"} promoted
        </p>

        {reissued.length ? (
          <>
            <p className="text-body text-sm">
              {reissued.length} moved into secondary school and received a new admission number. Write these on their
              files now — the old number still finds them in a search.
            </p>
            <ul className="flex flex-col">
              {reissued.map((student) => (
                <li
                  key={student.newNo}
                  className="border-border flex flex-wrap items-center gap-x-3 border-b py-2 text-sm last:border-b-0"
                >
                  <span className="text-foreground min-w-48 flex-1 font-medium">{student.name}</span>
                  <span className="text-muted-foreground font-mono text-xs line-through">{student.oldNo}</span>
                  <span className="text-foreground font-mono text-xs font-semibold">{student.newNo}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-body text-sm">
            They now appear in {result.students[0]?.to} for the new session. Their old class stays on their record.
          </p>
        )}
      </div>
    </ContentCard>
  );
}
