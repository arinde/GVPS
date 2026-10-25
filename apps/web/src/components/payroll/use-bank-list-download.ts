import { downloadBankSchedule } from "@/lib/bank-schedule-export";
import { notify } from "@/lib/notify";
import { useLazyGetBankScheduleQuery } from "@/store/api/payroll-api";

/** Fetches the month's bank list fresh, saves it as a CSV, and says plainly which rows need checking first. */
export function useBankListDownload(runId: string) {
  const [fetchSchedule, { isFetching }] = useLazyGetBankScheduleQuery();

  async function download() {
    try {
      const schedule = await fetchSchedule(runId, false).unwrap();
      downloadBankSchedule(schedule);
      const flagged = schedule.rows.filter((row) => row.accountChanged || row.missingAccount).length;
      if (flagged > 0) {
        notify.warning(`Bank list downloaded — ${flagged} ${flagged === 1 ? "row needs" : "rows need"} checking`, {
          description: "See the Check column. Confirm those accounts with the staff member before paying.",
        });
      } else {
        notify.success(`Bank list for ${schedule.label} downloaded`, {
          description: `${schedule.rows.length} transfers. Keep this file private — it has full account numbers.`,
        });
      }
    } catch (error) {
      notify.error(error, "Could not prepare the bank list.");
    }
  }

  return { download, downloading: isFetching };
}
