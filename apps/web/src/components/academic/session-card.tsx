import type { ReactNode } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { StatusPill } from "@/components/common/status-pill";
import { TermRow } from "@/components/academic/term-row";
import { formatDate } from "@/lib/dates";
import type { Session, Term } from "@/store/api/academic-api";

export type SessionCardProps = {
  session: Session;
  onMakeCurrent: (session: Session) => void;
  onMakeTermCurrent: (term: Term) => void;
  onTimesOpenedCommit: (term: Term, text: string) => void;
  busy?: boolean;
  /** The "add a term" form, or nothing once all three exist. */
  addTerm?: ReactNode;
};

/** One session with its terms. Presentational: everything arrives as props. */
export function SessionCard({
  session,
  onMakeCurrent,
  onMakeTermCurrent,
  onTimesOpenedCommit,
  busy = false,
  addTerm,
}: SessionCardProps) {
  return (
    <ContentCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{session.name}</h2>
          <p className="text-muted-foreground text-xs">
            {formatDate(session.startDate)} – {formatDate(session.endDate)}
          </p>
        </div>
        {session.isCurrent ? (
          <StatusPill tone="success" shape="circle">
            Current session
          </StatusPill>
        ) : (
          <AppButton variant="secondary" size="small" disabled={busy} onClick={() => onMakeCurrent(session)}>
            Make current
          </AppButton>
        )}
      </div>

      {session.terms.length === 0 ? (
        <p className="text-muted-foreground text-sm">No terms yet. Add the first below.</p>
      ) : (
        <ul className="flex flex-col">
          {session.terms.map((term) => (
            <TermRow
              key={term.id}
              term={term}
              onMakeCurrent={onMakeTermCurrent}
              onTimesOpenedCommit={onTimesOpenedCommit}
              busy={busy}
            />
          ))}
        </ul>
      )}

      {addTerm ? <div className="border-border border-t pt-4">{addTerm}</div> : null}
    </ContentCard>
  );
}
