"use client";

import { useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { StatusPill } from "@/components/common/status-pill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/dates";
import { notify } from "@/lib/notify";
import {
  useGetParentAccountStatusQuery,
  useIssueParentLoginMutation,
  useResetParentPasswordMutation,
  type IssuedParentLogin,
  type ParentAccountStatus,
} from "@/store/api/parent-accounts-api";

export type PortalAccessRowProps = { name: string; relationship: string; phone: string };

const STATES = {
  none: { tone: "info", shape: "hollow", text: "No login" },
  locked: { tone: "danger", shape: "square", text: "Locked" },
  pending: { tone: "warning", shape: "diamond", text: "Not signed in yet" },
  active: { tone: "success", shape: "circle", text: "Active" },
} as const;

function loginState(account: ParentAccountStatus["account"]): keyof typeof STATES {
  if (!account) return "none";
  if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) return "locked";
  return account.mustChangePassword ? "pending" : "active";
}

function statusPill(account: ParentAccountStatus["account"]) {
  const { tone, shape, text } = STATES[loginState(account)];
  return (
    <StatusPill tone={tone} shape={shape}>
      {text}
    </StatusPill>
  );
}

/**
 * One guardian's family-portal login: its state, and the action that fits —
 * create one, or reset its password. The temporary password is shown here
 * once, to be written on a slip; the API never returns it again.
 */
export function PortalAccessRow({ name, relationship, phone }: PortalAccessRowProps) {
  const { data: status, isLoading } = useGetParentAccountStatusQuery(phone);
  const [issue, issuing] = useIssueParentLoginMutation();
  const [reset, resetting] = useResetParentPasswordMutation();
  // The one-time password, held only until this page is left (AGENTS.md §2: no other source exists).
  const [issued, setIssued] = useState<IssuedParentLogin>();
  const busy = issuing.isLoading || resetting.isLoading;

  async function run(action: "issue" | "reset") {
    try {
      const result = action === "issue" ? await issue(phone).unwrap() : await reset(phone).unwrap();
      setIssued(result);
      notify.success(action === "issue" ? `Portal login created for ${name}` : `Password reset for ${name}`, {
        description: "Write the temporary password on a slip before leaving this page.",
        durationMs: 12_000,
      });
    } catch (error) {
      notify.error(error, `Could not update ${name}'s portal login.`);
    }
  }

  return (
    <li className="border-border flex flex-col gap-3 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">
            {name} <span className="text-muted-foreground font-normal">· {relationship}</span>
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            {phone}
            {status ? ` · ${status.children} child${status.children === 1 ? "" : "ren"} on this number` : ""}
            {status?.account?.lastLoginAt ? ` · last signed in ${formatDate(status.account.lastLoginAt)}` : ""}
          </p>
        </div>
        {status ? statusPill(status.account) : null}
        {isLoading ? null : status?.account ? (
          <AppButton variant="secondary" size="small" onClick={() => run("reset")} disabled={busy}>
            <KeyRound aria-hidden="true" />
            {resetting.isLoading ? "Resetting…" : "Reset password"}
          </AppButton>
        ) : (
          <AppButton size="small" onClick={() => run("issue")} disabled={busy}>
            <UserPlus aria-hidden="true" />
            {issuing.isLoading ? "Creating…" : "Create login"}
          </AppButton>
        )}
      </div>

      {issued ? (
        <Alert role="status">
          <AlertTitle>Slip for {name}</AlertTitle>
          <AlertDescription>
            Family portal: <strong>{typeof window === "undefined" ? "" : `${window.location.origin}/portal`}</strong>
            <br />
            Phone number: <strong className="font-mono">{issued.phone}</strong>
            <br />
            Temporary password: <strong className="font-mono">{issued.temporaryPassword}</strong>
            <br />
            Shown once. They choose their own password at first sign-in, and see all {issued.children} of their children
            with this one login.
          </AlertDescription>
        </Alert>
      ) : null}
    </li>
  );
}
