"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { TextInput } from "@/components/common/text-input";
import { notify } from "@/lib/notify";
import { printSignInSlip } from "@/lib/print-sign-in-slip";
import {
  useDeleteStaffMutation,
  useResetStaffPasswordMutation,
  type ResetPasswordResult,
} from "@/store/api/staff-lifecycle-api";

export type StaffAccountActionsProps = { staffId: string; name: string; email: string; schoolName: string };

/**
 * FEATURES.md §1.6 — a forgotten password is reset here, and the new one is
 * shown once with a printable slip. Deleting an account is a soft delete that
 * needs a reason, which goes to the audit log.
 */
export function StaffAccountActions({ staffId, name, email, schoolName }: StaffAccountActionsProps) {
  const router = useRouter();
  const [resetPassword, resetting] = useResetStaffPasswordMutation();
  const [deleteStaff, deleting] = useDeleteStaffMutation();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [newPassword, setNewPassword] = useState<ResetPasswordResult>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function reset() {
    try {
      const result = await resetPassword(staffId).unwrap();
      setNewPassword(result);
      setConfirmingReset(false);
      notify.success(`New temporary password created for ${name}`);
    } catch (error) {
      notify.error(error, "Could not reset this password.");
    }
  }

  async function remove() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      notify.warning("Give a short reason for deleting this account.");
      return;
    }
    try {
      await deleteStaff({ staffId, reason: trimmed }).unwrap();
      notify.success(`${name}'s account has been deleted`);
      router.push("/staff");
    } catch (error) {
      notify.error(error, "Could not delete this account.");
    }
  }

  return (
    <ContentCard className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-base">Password</h2>
        <p className="text-muted-foreground text-sm">
          Forgotten it? Reset it here. This signs them out everywhere and gives them a new temporary password.
        </p>
        {newPassword ? (
          <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <p>
              New temporary password: <strong className="font-mono">{newPassword.temporaryPassword}</strong>
            </p>
            <p className="text-muted-foreground text-xs">Shown once. Print the slip now and hand it over in person.</p>
            <div>
              <AppButton
                type="button"
                variant="secondary"
                size="small"
                onClick={() =>
                  printSignInSlip({ schoolName, name, email, temporaryPassword: newPassword.temporaryPassword })
                }
              >
                Print sign-in slip
              </AppButton>
            </div>
          </div>
        ) : null}
        {confirmingReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <AppButton type="button" variant="danger" onClick={reset} disabled={resetting.isLoading}>
              {resetting.isLoading ? "Resetting…" : "Yes, reset password"}
            </AppButton>
            <AppButton type="button" variant="ghost" onClick={() => setConfirmingReset(false)}>
              Cancel
            </AppButton>
          </div>
        ) : (
          <div>
            <AppButton type="button" variant="secondary" onClick={() => setConfirmingReset(true)}>
              Reset password
            </AppButton>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t pt-5">
        <h2 className="text-base">Delete account</h2>
        <p className="text-muted-foreground text-sm">
          They can no longer sign in. Their record and history are kept, and the deletion is logged with your reason.
        </p>
        {deleteOpen ? (
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              aria-label="Reason for deleting this account"
              placeholder="Reason, e.g. left the school"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-80"
            />
            <AppButton type="button" variant="danger" onClick={remove} disabled={deleting.isLoading}>
              {deleting.isLoading ? "Deleting…" : "Delete account"}
            </AppButton>
            <AppButton type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </AppButton>
          </div>
        ) : (
          <div>
            <AppButton type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete account
            </AppButton>
          </div>
        )}
      </section>
    </ContentCard>
  );
}
