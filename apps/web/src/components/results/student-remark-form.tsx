"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { FIELD_CLASSES } from "@/components/common/field-styles";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { TRAIT_LABELS, TRAIT_RATINGS } from "@/lib/traits";
import { cn } from "cn";
import type { RemarkStudent, SaveRemarkRequest, TraitGroups } from "@/store/api/remarks-api";

export type StudentRemarkFormProps = {
  student: RemarkStudent;
  traitGroups: TraitGroups;
  canWriteForm: boolean;
  canWritePrincipal: boolean;
  saving: boolean;
  onSave: (payload: Omit<SaveRemarkRequest, "termId" | "studentId">) => void;
};

const RATING_OPTIONS = TRAIT_RATINGS.map((rating) => ({ value: String(rating), label: `${rating} of 5` }));

/**
 * FEATURES.md §5.6–5.7. The draft starts from the saved values; the parent
 * passes `key={student.studentId}` so switching student resets it.
 */
export function StudentRemarkForm({
  student,
  traitGroups,
  canWriteForm,
  canWritePrincipal,
  saving,
  onSave,
}: StudentRemarkFormProps) {
  const [formComment, setFormComment] = useState(student.formComment ?? "");
  const [principalComment, setPrincipalComment] = useState(student.principalComment ?? "");
  const [traits, setTraits] = useState<Record<string, number>>(student.traits ?? {});

  if (student.locked) {
    return (
      <ContentCard>
        <h2 className="mb-2 text-base">{student.name}</h2>
        <p className="text-muted-foreground text-sm">
          This report card is published, so these remarks can no longer be changed.
        </p>
      </ContentCard>
    );
  }

  const traitList = [...traitGroups.affective, ...traitGroups.psychomotor];

  function submit() {
    onSave({
      ...(canWriteForm ? { formComment: formComment.trim() || null, traits } : {}),
      ...(canWritePrincipal ? { principalComment: principalComment.trim() || null } : {}),
    });
  }

  return (
    <ContentCard className="flex flex-col gap-5">
      <h2 className="text-base">{student.name}</h2>

      {canWriteForm ? (
        <>
          <FormField id="form-comment" label="Form teacher's comment" hint="Up to 300 characters.">
            <textarea
              {...controlProps("form-comment", undefined, "Up to 300 characters.")}
              rows={3}
              maxLength={300}
              value={formComment}
              onChange={(event) => setFormComment(event.target.value)}
              className={cn(FIELD_CLASSES, "h-auto w-full py-2")}
            />
          </FormField>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold">Traits (rated by the form teacher)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {traitList.map((trait) => (
                <FormField key={trait} id={`trait-${trait}`} label={TRAIT_LABELS[trait] ?? trait}>
                  <NativeSelect
                    {...controlProps(`trait-${trait}`)}
                    placeholder="Not rated"
                    options={RATING_OPTIONS}
                    value={traits[trait] ? String(traits[trait]) : ""}
                    onChange={(event) => {
                      const next = { ...traits };
                      if (event.target.value) next[trait] = Number(event.target.value);
                      else delete next[trait];
                      setTraits(next);
                    }}
                  />
                </FormField>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      {canWritePrincipal ? (
        <FormField id="principal-comment" label="Principal's comment" hint="Up to 300 characters.">
          <textarea
            {...controlProps("principal-comment", undefined, "Up to 300 characters.")}
            rows={3}
            maxLength={300}
            value={principalComment}
            onChange={(event) => setPrincipalComment(event.target.value)}
            className={cn(FIELD_CLASSES, "h-auto w-full py-2")}
          />
        </FormField>
      ) : null}

      <div>
        <AppButton type="button" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Save remarks"}
        </AppButton>
      </div>
    </ContentCard>
  );
}
