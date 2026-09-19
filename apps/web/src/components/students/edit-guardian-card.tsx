"use client";

import { useState, type FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { GuardianContactFields, type GuardianContact } from "@/components/students/guardian-contact-fields";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useUpdateGuardianMutation, type StudentProfile } from "@/store/api/students-api";

type Guardian = StudentProfile["guardians"][number]["guardian"];

const RELATIONSHIP = { FATHER: "Father", MOTHER: "Mother", GUARDIAN: "Guardian" } as const;

function toDraft(guardian: Guardian): GuardianContact {
  return {
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    phone: guardian.phone,
    altPhone: guardian.altPhone ?? undefined,
    email: guardian.email ?? "",
    occupation: guardian.occupation ?? "",
  };
}

export type EditGuardianCardProps = {
  guardian: Guardian;
  relationship: keyof typeof RELATIONSHIP;
  /** Whether this student has siblings in the school, who may share this guardian. */
  hasSiblings: boolean;
};

/**
 * One parent or guardian, saved on its own: a guardian can be shared by
 * siblings, so this edits the person, and each save is its own audit entry.
 * The draft is this card's unsaved edits (AGENTS.md §2); the caller keys it
 * on the guardian's id.
 */
export function EditGuardianCard({ guardian, relationship, hasSiblings }: EditGuardianCardProps) {
  const [draft, setDraft] = useState<GuardianContact>(() => toDraft(guardian));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updateGuardian, { isLoading }] = useUpdateGuardianMutation();
  const name = `${draft.firstName} ${draft.lastName}`;

  function patch(changes: Partial<GuardianContact>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setErrors((current) => withoutFieldErrors(current, Object.keys(changes)));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== "")) as GuardianContact;
    try {
      const { changed } = await updateGuardian({ guardianId: guardian.id, details }).unwrap();
      notify.success(changed ? `Saved ${name}'s details` : `Nothing had changed for ${name}`);
    } catch (error) {
      setErrors(notify.error(error, `Could not save ${name}'s details.`).fieldErrors);
    }
  }

  return (
    <ContentCard>
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <div>
          <h2 className="text-base">
            {RELATIONSHIP[relationship]}: {guardian.firstName} {guardian.lastName}
          </h2>
          {hasSiblings ? (
            <p className="text-muted-foreground text-xs">
              This student has siblings here. If they share this guardian, a change reaches their records too.
            </p>
          ) : null}
        </div>

        <GuardianContactFields
          idPrefix={`guardian-${guardian.id}`}
          value={draft}
          onChange={patch}
          errors={errors}
          disabled={isLoading}
        />

        <div className="flex justify-end">
          <AppButton type="submit" variant="secondary" disabled={isLoading}>
            {isLoading ? "Saving…" : "Save this guardian"}
          </AppButton>
        </div>
      </form>
    </ContentCard>
  );
}
