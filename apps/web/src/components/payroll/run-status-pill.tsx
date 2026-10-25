import { StatusPill } from "@/components/common/status-pill";
import type { PayrollRunStatus } from "@/store/api/payroll-api";

/** A draft can still change; a finalised month is what was paid. Shape and word, never colour alone. */
export function RunStatusPill({ status }: { status: PayrollRunStatus }) {
  return status === "FINALISED" ? (
    <StatusPill tone="success" shape="circle">
      Finalised
    </StatusPill>
  ) : (
    <StatusPill tone="warning" shape="diamond">
      Draft
    </StatusPill>
  );
}
