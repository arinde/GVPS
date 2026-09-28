"use client";

import { useState } from "react";
import { TermForm, type TermDraft } from "@/components/academic/term-form";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useAddTermMutation, type Session } from "@/store/api/academic-api";

const TERM_NAMES = ["First Term", "Second Term", "Third Term"];
const EMPTY: TermDraft = { sequence: "", name: "", startDate: "", endDate: "" };

/**
 * Adds a term to one session. Each session gets its own panel, so the draft
 * belongs here rather than to the page (AGENTS.md §2).
 */
export function AddTermPanel({ session }: { session: Session }) {
  const [addTerm, { isLoading }] = useAddTermMutation();
  const [draft, setDraft] = useState<TermDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const taken = session.terms.map((term) => term.sequence);
  const sequences = TERM_NAMES.map((name, index) => ({ value: String(index + 1), label: name })).filter(
    (option) => !taken.includes(Number(option.value)),
  );

  if (sequences.length === 0) return null;

  async function add() {
    try {
      const term = await addTerm({
        sessionId: session.id,
        sequence: Number(draft.sequence),
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
      }).unwrap();
      notify.success(`${term.name} added to ${session.name}`);
      setDraft(EMPTY);
      setErrors({});
    } catch (error) {
      setErrors(notify.error(error, "Could not add the term.").fieldErrors);
    }
  }

  return (
    <TermForm
      idPrefix={`term-${session.id}`}
      value={draft}
      sequences={sequences}
      onChange={(patch) => {
        setDraft((previous) => ({ ...previous, ...patch }));
        setErrors((current) => withoutFieldErrors(current, Object.keys(patch)));
      }}
      onSubmit={add}
      errors={errors}
      isSubmitting={isLoading}
    />
  );
}
