"use client";

import { useState } from "react";
import { Check, Clock, ShieldCheck, X } from "lucide-react";
import { cn } from "cn";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  type AttendanceMark,
  type AttendanceRegister,
  type AttendanceStatus,
} from "@/store/api/attendance-api";

const STATUS_ICON: Record<AttendanceStatus, typeof Check> = {
  PRESENT: Check,
  ABSENT: X,
  LATE: Clock,
  EXCUSED: ShieldCheck,
};

const STATUS_TONE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-success text-success-foreground border-success-border",
  ABSENT: "bg-danger text-danger-foreground border-danger-border",
  LATE: "bg-warning text-warning-foreground border-warning-border",
  EXCUSED: "bg-info text-info-foreground border-info-border",
};

export type AttendanceRegisterTableProps = {
  register: AttendanceRegister;
  saving: boolean;
  onSave: (marks: AttendanceMark[]) => void;
};

/**
 * One student per row, four status pills each — tap one, it's picked. Every
 * student not yet marked defaults to Present (the common case), so a
 * teacher taps only the exceptions instead of confirming thirty students
 * one at a time (AGENTS.md §12: entering a whole class on a phone).
 */
export function AttendanceRegisterTable({ register, saving, onSave }: AttendanceRegisterTableProps) {
  const existing = new Map(register.marks.map((mark) => [mark.studentId, mark.status]));
  const [drafts, setDrafts] = useState<Record<string, AttendanceStatus>>({});

  function statusFor(studentId: string): AttendanceStatus {
    return drafts[studentId] ?? existing.get(studentId) ?? "PRESENT";
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setDrafts((current) => ({ ...current, [studentId]: status }));
  }

  function save() {
    onSave(register.students.map((student) => ({ studentId: student.id, status: statusFor(student.id) })));
  }

  if (register.students.length === 0) {
    return (
      <ContentCard>
        <p className="text-muted-foreground text-sm">No actively-enrolled students in this class.</p>
      </ContentCard>
    );
  }

  return (
    <ContentCard flush>
      <div className="divide-y">
        {register.students.map((student) => {
          const status = statusFor(student.id);
          return (
            <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-medium">
                  {student.lastName}, {student.firstName}
                </p>
                <p className="text-muted-foreground text-xs">{student.admissionNo}</p>
              </div>
              <div className="flex gap-1.5" role="radiogroup" aria-label={`${student.firstName}'s attendance`}>
                {ATTENDANCE_STATUSES.map((candidate) => {
                  const Icon = STATUS_ICON[candidate];
                  const active = status === candidate;
                  return (
                    <button
                      key={candidate}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setStatus(student.id, candidate)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-colors",
                        active
                          ? STATUS_TONE[candidate]
                          : "text-foreground border-border hover:border-foreground hover:bg-zebra bg-white",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-3.5" />
                      {ATTENDANCE_STATUS_LABELS[candidate]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t px-5 py-4">
        <AppButton type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save attendance"}
        </AppButton>
      </div>
    </ContentCard>
  );
}
