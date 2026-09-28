"use client";

import { useState } from "react";
import { AddTermPanel } from "@/components/academic/add-term-panel";
import { SessionCard } from "@/components/academic/session-card";
import { SessionForm } from "@/components/academic/session-form";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import {
  useCreateSessionMutation,
  useListSessionsQuery,
  useSetCurrentSessionMutation,
  useSetCurrentTermMutation,
  useSetTimesSchoolOpenedMutation,
  type CreateSessionRequest,
  type Session,
  type Term,
} from "@/store/api/academic-api";

const EMPTY: CreateSessionRequest = { name: "", startDate: "", endDate: "" };

/**
 * The school year (FEATURES.md §2.1): sessions, their terms, and which of
 * each is current. Almost every screen filters by the current session and
 * term, so this is where a new year starts and where each term is opened.
 */
export function AcademicYearView() {
  const { data: sessions = [], isLoading } = useListSessionsQuery();
  const [createSession, creating] = useCreateSessionMutation();
  const [setCurrentSession, switchingSession] = useSetCurrentSessionMutation();
  const [setCurrentTerm, switchingTerm] = useSetCurrentTermMutation();
  const [setTimesOpened, savingDays] = useSetTimesSchoolOpenedMutation();
  // The unsaved new session (AGENTS.md §2: local form state).
  const [draft, setDraft] = useState<CreateSessionRequest>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const busy = switchingSession.isLoading || switchingTerm.isLoading || savingDays.isLoading;
  const current = sessions.find((session) => session.isCurrent);
  const currentTerm = current?.terms.find((term) => term.isCurrent);

  async function create() {
    try {
      const session = await createSession({ ...draft, name: draft.name.trim() }).unwrap();
      notify.success(`${session.name} created`, { description: "Add its three terms below." });
      setDraft(EMPTY);
      setErrors({});
    } catch (error) {
      setErrors(notify.error(error, "Could not create the session.").fieldErrors);
    }
  }

  async function makeCurrent(session: Session) {
    try {
      await setCurrentSession(session.id).unwrap();
      notify.success(`${session.name} is now the current session`, {
        description: "Registration and class allocation now work in this session.",
      });
    } catch (error) {
      notify.error(error, `Could not switch to ${session.name}.`);
    }
  }

  async function makeTermCurrent(term: Term) {
    try {
      await setCurrentTerm(term.id).unwrap();
      notify.success(`${term.name} is now the current term`);
    } catch (error) {
      notify.error(error, `Could not switch to ${term.name}.`);
    }
  }

  async function saveDaysOpened(term: Term, text: string) {
    const days = Number(text.trim());
    if (!text.trim() || !Number.isInteger(days) || days < 0 || days > 300) {
      notify.warning("Days opened must be a whole number from 0 to 300.", { description: `${term.name} unchanged.` });
      return;
    }
    try {
      await setTimesOpened({ termId: term.id, timesSchoolOpened: days }).unwrap();
      notify.success(`${term.name}: school opened ${days} days`);
    } catch (error) {
      notify.error(error, `Could not save the days for ${term.name}.`);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Academic year"
        subtitle={
          current
            ? `Current: ${current.name}${currentTerm ? ` · ${currentTerm.name}` : " · no current term"}`
            : "No current session — set one before registering students"
        }
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="text-base">Start a new session</h2>
          <p className="text-muted-foreground mb-4 text-xs">
            Creating a session does not switch to it. Add its terms first, then make it current when the year begins.
          </p>
          <SessionForm
            value={draft}
            onChange={(patch) => {
              setDraft((previous) => ({ ...previous, ...patch }));
              setErrors((current) => withoutFieldErrors(current, Object.keys(patch)));
            }}
            onSubmit={create}
            errors={errors}
            isSubmitting={creating.isLoading}
          />
        </ContentCard>

        {isLoading ? (
          <p className="text-muted-foreground text-sm" role="status">
            Loading sessions…
          </p>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onMakeCurrent={makeCurrent}
              onMakeTermCurrent={makeTermCurrent}
              onTimesOpenedCommit={saveDaysOpened}
              busy={busy}
              addTerm={<AddTermPanel session={session} />}
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
