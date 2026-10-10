"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_generate_1 = require("./src/timetable/auto-generate");
const periods = Array.from({ length: 9 }, (_, i) => ({ id: `p${i + 1}`, sequence: i + 1 }));
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const comboSlots = [
  { day: "MONDAY", periodId: "p2" },
  { day: "TUESDAY", periodId: "p2" },
];
const loads = [
  { subjectId: "MTH", staffId: "t-mth", periodsPerWeek: 5, fixedDay: null },
  { subjectId: "ENG", staffId: "t-eng", periodsPerWeek: 5, fixedDay: null },
  { subjectId: "CHE", staffId: "t-che", periodsPerWeek: 4, fixedDay: null, comboGroup: "combo-1", comboSlots },
  { subjectId: "GOV", staffId: "t-gov", periodsPerWeek: 4, fixedDay: null, comboGroup: "combo-1", comboSlots },
  { subjectId: "ACC", staffId: "t-acc", periodsPerWeek: 4, fixedDay: null, comboGroup: "combo-1", comboSlots },
];
const { placed, unplaced } = (0, auto_generate_1.planTimetable)({ days, periods, loads, busyElsewhere: new Set() });
const keys = placed.map((s) => `${s.day}|${s.periodId}|${s.subjectId}`);
const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
console.log(dupes.length === 0 ? "PASSED: no duplicate (day, period, subject) entries" : `FAILED: duplicates ${dupes}`);
for (const day of days) {
  const row = periods.map((p) => {
    const here = placed.filter((s) => s.day === day && s.periodId === p.id).map((s) => s.subjectId);
    return here.length ? here.join("+") : "-";
  });
  console.log(day.padEnd(10), row.join(" "));
}
console.log("unplaced:", unplaced);
//# sourceMappingURL=verify-scratch.js.map
