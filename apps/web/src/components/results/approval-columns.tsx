import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppButton } from "@/components/common/app-button";
import { StatusPill } from "@/components/common/status-pill";
import { formatDate } from "@/lib/dates";
import type { ApprovalSubject, ResultSheetStatus } from "@/store/api/approval-api";

export type ApprovalActions = {
  roles: string[];
  onSubmit: (subject: ApprovalSubject) => void;
  onReview: (subject: ApprovalSubject) => void;
  onApprove: (subject: ApprovalSubject) => void;
  onReopen: (subject: ApprovalSubject) => void;
  onView: (subject: ApprovalSubject) => void;
};

const STATUS: Record<
  ResultSheetStatus,
  { label: string; tone: "warning" | "info" | "success"; shape: "circle" | "diamond" | "hollow" }
> = {
  DRAFT: { label: "Not submitted", tone: "warning", shape: "diamond" },
  SUBMITTED: { label: "Submitted", tone: "info", shape: "hollow" },
  REVIEWED: { label: "Reviewed", tone: "info", shape: "hollow" },
  APPROVED: { label: "Approved", tone: "success", shape: "circle" },
  PUBLISHED: { label: "Published", tone: "success", shape: "circle" },
};

const helper = createColumnHelper<StockFeatures, ApprovalSubject>();

/**
 * FEATURES.md §14 "Result approval": each person sees only the step they can
 * take. The API enforces the same rules — this only decides what to show.
 */
export function approvalColumns(actions: ApprovalActions): ColumnDef<StockFeatures, ApprovalSubject, unknown>[] {
  const isTeacher = actions.roles.includes("SUBJECT_TEACHER") || actions.roles.includes("SUPERADMIN");
  const isFormTeacher = actions.roles.includes("FORM_TEACHER") || actions.roles.includes("SUPERADMIN");
  const isPrincipal = actions.roles.includes("PRINCIPAL") || actions.roles.includes("SUPERADMIN");

  return [
    helper.accessor("subjectName", { header: "Subject" }),
    helper.accessor("teacherName", { header: "Subject teacher" }),
    helper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const { label, tone, shape } = STATUS[row.original.status];
        return (
          <StatusPill tone={tone} shape={shape}>
            {label}
          </StatusPill>
        );
      },
    }),
    helper.accessor((row) => (row.submittedAt ? formatDate(row.submittedAt) : "—"), {
      id: "submitted",
      header: "Submitted",
    }),
    helper.display({
      id: "view",
      header: "",
      cell: ({ row }) => (
        <AppButton size="small" variant="ghost" onClick={() => actions.onView(row.original)}>
          View scores
        </AppButton>
      ),
    }),
    helper.display({
      id: "action",
      header: "Next step",
      cell: ({ row }) => {
        const subject = row.original;
        const waiting = (text: string) => <span className="text-muted-foreground text-xs">{text}</span>;

        switch (subject.status) {
          case "DRAFT":
            return isTeacher ? (
              <AppButton size="small" onClick={() => actions.onSubmit(subject)}>
                Submit scores
              </AppButton>
            ) : (
              waiting("Waiting for the subject teacher")
            );
          case "SUBMITTED":
            return isFormTeacher ? (
              <AppButton size="small" onClick={() => actions.onReview(subject)}>
                Mark as reviewed
              </AppButton>
            ) : (
              waiting("Waiting for form teacher review")
            );
          case "REVIEWED":
            return isPrincipal ? (
              <AppButton size="small" onClick={() => actions.onApprove(subject)}>
                Approve and freeze
              </AppButton>
            ) : (
              waiting("Waiting for principal approval")
            );
          case "APPROVED":
          case "PUBLISHED":
            return isPrincipal ? (
              <AppButton size="small" variant="secondary" onClick={() => actions.onReopen(subject)}>
                Reopen
              </AppButton>
            ) : (
              waiting("Locked")
            );
        }
      },
    }),
  ] as ColumnDef<StockFeatures, ApprovalSubject, unknown>[];
}
