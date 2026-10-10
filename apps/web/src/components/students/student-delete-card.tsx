"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { TextInput } from "@/components/common/text-input";
import { notify } from "@/lib/notify";
import { useDeleteStudentMutation } from "@/store/api/student-lifecycle-api";

export type StudentDeleteCardProps = { studentId: string; name: string };

/**
 * FEATURES.md §0 — deleting a student is reversible in the database and always
 * logged. Their fees, payments and results stay for history; they leave the
 * registry and their class.
 */
export function StudentDeleteCard({ studentId, name }: StudentDeleteCardProps) {
  const router = useRouter();
  const [deleteStudent, deleting] = useDeleteStudentMutation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function remove() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      notify.warning("Give a short reason for deleting this student.");
      return;
    }
    try {
      await deleteStudent({ studentId, reason: trimmed }).unwrap();
      notify.success(`${name} has been deleted from the registry`);
      router.push("/students");
    } catch (error) {
      notify.error(error, "Could not delete this student.");
    }
  }

  return (
    <ContentCard className="flex flex-col gap-3">
      <h2 className="text-base">Delete student</h2>
      <p className="text-muted-foreground text-sm">
        Removes {name} from the registry and closes their class. Their fees, payments and results are kept for history,
        and the deletion is logged with your reason.
      </p>
      {open ? (
        <div className="flex flex-wrap items-center gap-2">
          <TextInput
            aria-label="Reason for deleting this student"
            placeholder="Reason, e.g. registered in error"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-80"
          />
          <AppButton type="button" variant="danger" onClick={remove} disabled={deleting.isLoading}>
            {deleting.isLoading ? "Deleting…" : "Delete student"}
          </AppButton>
          <AppButton type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </AppButton>
        </div>
      ) : (
        <div>
          <AppButton type="button" variant="danger" onClick={() => setOpen(true)}>
            Delete student
          </AppButton>
        </div>
      )}
    </ContentCard>
  );
}
