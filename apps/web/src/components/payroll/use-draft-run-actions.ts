import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import {
  useDeletePayrollRunMutation,
  useFinalisePayrollRunMutation,
  useRefreshPayrollRunMutation,
} from "@/store/api/payroll-api";

async function act(action: () => Promise<unknown>, success: string, failure: string): Promise<boolean> {
  try {
    await action();
    notify.success(success);
    return true;
  } catch (error) {
    notify.error(error, failure);
    return false;
  }
}

/** Refresh, finalise and delete for a draft month, each toasting its outcome and resolving whether it worked. */
export function useDraftRunActions(run: { id: string; label: string }) {
  const router = useRouter();
  const [refreshRun, refreshing] = useRefreshPayrollRunMutation();
  const [finaliseRun, finalising] = useFinalisePayrollRunMutation();
  const [deleteRun, deleting] = useDeletePayrollRunMutation();

  return {
    busy: refreshing.isLoading || finalising.isLoading || deleting.isLoading,
    onRefresh: () => act(() => refreshRun(run.id).unwrap(), "Payslips refreshed from salaries", "Could not refresh."),
    onFinalise: () =>
      act(() => finaliseRun(run.id).unwrap(), `Payroll for ${run.label} finalised`, "Could not finalise this payroll."),
    onDelete: async () => {
      const done = await act(() => deleteRun(run.id).unwrap(), "Draft payroll deleted", "Could not delete.");
      if (done) router.push("/payroll");
      return done;
    },
  };
}
