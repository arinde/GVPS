"use client";

import { useState } from "react";
import { ContentCard } from "@/components/common/content-card";
import { MoveClassForm, type MoveClassDraft } from "@/components/students/move-class-form";
import { EXIT_OPTIONS, RecordExitForm, type RecordExitDraft } from "@/components/students/record-exit-form";
import { DEPARTMENT_OPTIONS } from "@/components/subjects/subject-labels";
import { notify } from "@/lib/notify";
import { useListClassArmsQuery } from "@/store/api/academic-api";
import { useExitEnrolmentMutation, useTransferEnrolmentMutation, type ExitStatus } from "@/store/api/promotions-api";

export type EnrolmentActionsCardProps = {
  studentId: string;
  name: string;
  /** The student's active enrolment this session; nothing to act on without one. */
  enrolment: { id: string; className: string; sessionName: string };
};

const EMPTY_MOVE: MoveClassDraft = { classArmId: "", stream: "", reason: "" };
const EMPTY_EXIT: RecordExitDraft = { status: "", exitedOn: new Date().toISOString().slice(0, 10), reason: "" };

/**
 * What can happen to a student inside the session they are in: a move to
 * another class, or leaving the school (FEATURES.md §3.6). Moving up a year
 * is not here — that is Promotion, for a whole class at once.
 */
export function EnrolmentActionsCard({ studentId, name, enrolment }: EnrolmentActionsCardProps) {
  const { data: arms = [] } = useListClassArmsQuery();
  const [transfer, moving] = useTransferEnrolmentMutation();
  const [exit, exiting] = useExitEnrolmentMutation();
  // Unsaved choices in the two forms (AGENTS.md §2: local form state).
  const [move, setMove] = useState<MoveClassDraft>(EMPTY_MOVE);
  const [leave, setLeave] = useState<RecordExitDraft>(EMPTY_EXIT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const destination = arms.find((arm) => arm.id === move.classArmId);
  const needsDepartment = destination?.classLevel.section === "SENIOR" && !destination.stream;

  async function moveClass() {
    try {
      await transfer({
        enrolmentId: enrolment.id,
        studentId,
        classArmId: move.classArmId,
        ...(move.stream ? { stream: move.stream } : {}),
        ...(move.reason.trim() ? { reason: move.reason.trim() } : {}),
      }).unwrap();
      const label = destination ? `${destination.classLevel.name}${destination.name}` : "the new class";
      notify.success(`${name} moved to ${label}`);
      setMove(EMPTY_MOVE);
      setErrors({});
    } catch (error) {
      setErrors(notify.error(error, `Could not move ${name}.`).fieldErrors);
    }
  }

  async function recordExit() {
    try {
      await exit({
        enrolmentId: enrolment.id,
        studentId,
        status: leave.status as ExitStatus,
        exitedOn: leave.exitedOn,
        ...(leave.reason.trim() ? { reason: leave.reason.trim() } : {}),
      }).unwrap();
      const label = EXIT_OPTIONS.find((option) => option.value === leave.status)?.label ?? "left";
      notify.success(`${name}: ${label.toLowerCase()} recorded`, {
        description: "Their record and history stay; they no longer appear in the class.",
      });
      setLeave(EMPTY_EXIT);
      setErrors({});
    } catch (error) {
      setErrors(notify.error(error, `Could not record this for ${name}.`).fieldErrors);
    }
  }

  return (
    <ContentCard className="flex flex-col gap-6">
      <div>
        <h2 className="text-base">Class and enrolment</h2>
        <p className="text-muted-foreground text-xs">
          {enrolment.className} · {enrolment.sessionName}. Moving up a year is done under Promotion, for a whole class.
        </p>
      </div>

      <MoveClassForm
        classes={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
        departments={DEPARTMENT_OPTIONS}
        value={move}
        needsDepartment={Boolean(needsDepartment)}
        onChange={(patch) => setMove((previous) => ({ ...previous, ...patch }))}
        onSubmit={moveClass}
        errors={errors}
        isSubmitting={moving.isLoading}
      />

      <div className="border-border border-t pt-5">
        <h3 className="mb-3 text-sm font-semibold">If the student has left</h3>
        <RecordExitForm
          value={leave}
          onChange={(patch) => setLeave((previous) => ({ ...previous, ...patch }))}
          onSubmit={recordExit}
          errors={errors}
          isSubmitting={exiting.isLoading}
        />
      </div>
    </ContentCard>
  );
}
