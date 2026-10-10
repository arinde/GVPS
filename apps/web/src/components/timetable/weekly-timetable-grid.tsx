import { cn } from "cn";
import { ACTIVITY_COLOR, READING_COLOR, colorForSubject } from "@/lib/subject-color";
import { buildDayActions, isReadingPeriod, timeRange, todayDayOfWeek, type SubjectEntry } from "@/lib/timetable-grid";
import { DAY_LABELS, type ArmGrid, type DayOfWeek, type Period } from "@/store/api/timetable-api";

export type WeeklyTimetableGridProps = {
  grid: ArmGrid;
  /** When set, a clickable cell calls this with the day and its first period — presentational, no data fetching here. */
  onCellClick?: (day: DayOfWeek, period: Period) => void;
};

/**
 * Desktop timetable: one row per weekday, one column per period, with
 * consecutive same-subject periods merged into a single "double period"
 * cell and non-teaching periods (breaks, assembly) merged down the whole
 * week since the backend gives every day the same ones.
 */
export function WeeklyTimetableGrid({ grid, onCellClick }: WeeklyTimetableGridProps) {
  const today = todayDayOfWeek(grid.days);
  const actionsByDay = new Map(grid.days.map((day) => [day, buildDayActions(grid, day)]));

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[780px] table-fixed text-sm" role="grid">
        <caption className="sr-only">{grid.classLabel} weekly timetable</caption>
        <thead className="text-muted-foreground border-b text-left text-xs">
          <tr>
            <th scope="col" className="w-14 px-3 py-2 font-medium">
              Day
            </th>
            {grid.periods.map((period) =>
              period.isTeaching ? (
                <th key={period.id} scope="col" className="px-2 py-2 text-center font-medium">
                  <span className="block">{period.name}</span>
                  <span className="text-muted-foreground block font-normal">
                    {period.startTime}–{period.endTime}
                  </span>
                </th>
              ) : (
                <th key={period.id} scope="col" className="w-7 px-1 py-2 text-center font-medium">
                  <span className="rotate-180 [writing-mode:vertical-rl]">
                    {period.startTime}–{period.endTime}
                  </span>
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {grid.days.map((day, dayIndex) => {
            const actions = actionsByDay.get(day) ?? new Map();
            return (
              <tr key={day} className="border-b last:border-0">
                <th
                  scope="row"
                  className={cn(
                    "bg-muted px-3 py-2.5 text-left text-xs font-medium",
                    day === today && "border-l-primary text-primary border-l-2",
                  )}
                >
                  {DAY_LABELS[day]}
                </th>
                {grid.periods.map((period) => {
                  if (!period.isTeaching) {
                    // Identical every day — rendered once, spanning every day-row.
                    if (dayIndex !== 0) return null;
                    return (
                      <td
                        key={period.id}
                        rowSpan={grid.days.length}
                        className="bg-muted text-muted-foreground px-1 py-2 text-center text-[11px]"
                        aria-label={`${period.name}, every day`}
                      >
                        <span className="rotate-180 [writing-mode:vertical-rl]">{period.name}</span>
                      </td>
                    );
                  }

                  const action = actions.get(period.id);
                  if (!action || action.type === "consumed") return null;

                  if (action.type === "empty") {
                    const reading = isReadingPeriod(period);
                    const tint = reading ? `${READING_COLOR.bg} ${READING_COLOR.fg}` : "text-muted-foreground";
                    const text = reading ? "Reading period" : "Set lesson";
                    return onCellClick ? (
                      <td key={period.id} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => onCellClick(day, period)}
                          className={cn("hover:bg-zebra w-full rounded-md px-2 py-2 text-center text-xs", tint)}
                          aria-label={`${DAY_LABELS[day]}, ${period.name}, ${reading ? "reading period" : "no lesson set"}`}
                        >
                          {text}
                        </button>
                      </td>
                    ) : (
                      <td key={period.id} className={cn("rounded-md px-2 py-2 text-center text-xs", tint)}>
                        {text}
                      </td>
                    );
                  }

                  const range = timeRange(period, action.endTime);
                  const isCombo = action.subjects.length > 1;

                  if (isCombo) {
                    const label = `${DAY_LABELS[day]}, choice of ${action.subjects.map((subject: SubjectEntry) => subject.subjectName).join(", ")}, ${range}`;
                    const content = (
                      <>
                        {action.subjects.map((subject: SubjectEntry) => {
                          const color = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);
                          return (
                            <span key={subject.subjectId} className={cn("block rounded px-1", color.bg, color.fg)}>
                              {subject.subjectName}
                              {!subject.staffId && "*"}
                            </span>
                          );
                        })}
                        <span className="text-muted-foreground block text-[11px]">{range}</span>
                      </>
                    );
                    return (
                      <td key={period.id} className="p-0.5">
                        {onCellClick ? (
                          <button
                            type="button"
                            onClick={() => onCellClick(day, period)}
                            className="hover:bg-zebra w-full space-y-0.5 rounded-md p-1 text-center"
                            aria-label={label}
                          >
                            {content}
                          </button>
                        ) : (
                          <div className="w-full space-y-0.5 rounded-md p-1 text-center" aria-label={label}>
                            {content}
                          </div>
                        )}
                      </td>
                    );
                  }

                  const subject = action.subjects[0];
                  const label = `${DAY_LABELS[day]}, ${subject.subjectName}${
                    subject.isActivity ? ", activity" : action.span > 1 ? ", double period" : ""
                  }, ${range}${subject.staffId ? "" : ", no teacher assigned yet"}`;
                  const color = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);

                  const content = (
                    <>
                      <span className="block font-medium">{subject.subjectName}</span>
                      <span className="block text-[11px] opacity-80">
                        {subject.staffId ? range : `${range} · no teacher yet`}
                      </span>
                      {action.span > 1 || subject.isActivity ? (
                        <span className="block text-[11px] font-semibold opacity-90">
                          {subject.isActivity ? "Activity" : "Double"}
                        </span>
                      ) : null}
                    </>
                  );

                  return (
                    <td key={period.id} colSpan={action.span} className="p-0.5">
                      {onCellClick ? (
                        <button
                          type="button"
                          onClick={() => onCellClick(day, period)}
                          className={cn("w-full rounded-md px-2 py-2 text-center", color.bg, color.fg)}
                          aria-label={label}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className={cn("rounded-md px-2 py-2 text-center", color.bg, color.fg)} aria-label={label}>
                          {content}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
