"use client";

import { useState } from "react";
import { cn } from "cn";
import { ACTIVITY_COLOR, READING_COLOR, colorForSubject } from "@/lib/subject-color";
import { buildDayActions, isReadingPeriod, timeRange, todayDayOfWeek } from "@/lib/timetable-grid";
import { DAY_LABELS, type ArmGrid, type DayOfWeek, type Period } from "@/store/api/timetable-api";

export type WeeklyTimetableMobileProps = {
  grid: ArmGrid;
  onCellClick?: (day: DayOfWeek, period: Period) => void;
};

/** Phone-width companion to WeeklyTimetableGrid — one day at a time instead of a wide grid. */
export function WeeklyTimetableMobile({ grid, onCellClick }: WeeklyTimetableMobileProps) {
  const [selected, setSelected] = useState<DayOfWeek>(() => todayDayOfWeek(grid.days) ?? grid.days[0]);
  const actions = buildDayActions(grid, selected);
  const isLastDay = selected === grid.days[grid.days.length - 1];

  return (
    <div className="md:hidden">
      <div
        role="tablist"
        aria-label="Day"
        className="sticky top-0 z-10 mb-3 flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      >
        {grid.days.map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={selected === day}
            onClick={() => setSelected(day)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium",
              selected === day ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {DAY_LABELS[day].slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="border-border overflow-hidden rounded-xl border bg-white">
        {grid.periods.map((period) => {
          if (!period.isTeaching) {
            return (
              <div
                key={period.id}
                className="bg-muted text-muted-foreground flex items-center justify-between gap-3 border-b px-4 py-1.5 text-xs last:border-0"
              >
                <span className="w-20 shrink-0">
                  {period.startTime}–{period.endTime}
                </span>
                <span className="flex-1 text-right">{period.name}</span>
              </div>
            );
          }

          const action = actions.get(period.id);
          if (!action || action.type === "consumed") return null;

          if (action.type === "empty") {
            const reading = isReadingPeriod(period);
            const row = (
              <div
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3",
                  reading ? `${READING_COLOR.bg} ${READING_COLOR.fg}` : "",
                )}
              >
                <span className={cn("w-20 shrink-0 text-xs", reading ? "" : "text-muted-foreground")}>
                  {period.startTime}–{period.endTime}
                </span>
                <span className={cn("flex-1 text-right text-sm", reading ? "" : "text-muted-foreground")}>
                  {reading ? "Reading period" : `${period.name} · open`}
                </span>
              </div>
            );
            return (
              <div key={period.id} className="border-b last:border-0">
                {onCellClick ? (
                  <button type="button" onClick={() => onCellClick(selected, period)} className="hover:bg-zebra w-full">
                    {row}
                  </button>
                ) : (
                  row
                )}
              </div>
            );
          }

          const range = timeRange(period, action.endTime);
          const isCombo = action.subjects.length > 1;

          const row = isCombo ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-muted-foreground w-20 shrink-0 text-xs">{range}</span>
              <span className="flex-1 space-y-0.5 text-right">
                {action.subjects.map((subject) => {
                  const color = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);
                  return (
                    <span
                      key={subject.subjectId}
                      className={cn("block rounded px-1.5 py-0.5 text-sm font-medium", color.bg, color.fg)}
                    >
                      {subject.subjectName}
                      {!subject.staffId && " ·  no teacher yet"}
                    </span>
                  );
                })}
              </span>
            </div>
          ) : (
            (() => {
              const subject = action.subjects[0];
              const color = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);
              const sublabel = subject.isActivity
                ? "Activity"
                : action.span > 1
                  ? `Double · ${period.name}`
                  : period.name;
              const staffLine = subject.staffId ? null : "No teacher assigned yet";
              return (
                <div className={cn("flex items-center justify-between gap-3 px-4 py-3", color.bg, color.fg)}>
                  <span className="w-20 shrink-0 text-xs opacity-80">{range}</span>
                  <span className="flex-1 text-right">
                    <span className="block text-sm font-medium">{subject.subjectName}</span>
                    <span className="block text-xs opacity-80">{staffLine ?? sublabel}</span>
                  </span>
                </div>
              );
            })()
          );

          return (
            <div key={period.id} className="border-b last:border-0">
              {onCellClick ? (
                <button type="button" onClick={() => onCellClick(selected, period)} className="hover:bg-zebra w-full">
                  {row}
                </button>
              ) : (
                row
              )}
            </div>
          );
        })}
      </div>

      {isLastDay ? (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {DAY_LABELS[selected]} is the end of the school week.
        </p>
      ) : null}
    </div>
  );
}
