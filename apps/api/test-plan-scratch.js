"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_generate_1 = require("./src/timetable/auto-generate");
const periods = [
  { id: "p1", sequence: 1 },
  { id: "p2", sequence: 2 },
  { id: "p3", sequence: 3 },
];
const result = (0, auto_generate_1.planTimetable)({
  days: ["MONDAY", "TUESDAY"],
  periods,
  loads: [
    { subjectId: "s-with-teacher", staffId: "t1", periodsPerWeek: 2, fixedDay: null },
    { subjectId: "s-no-teacher", staffId: null, periodsPerWeek: 2, fixedDay: null },
  ],
  busyElsewhere: new Set(),
});
console.log(JSON.stringify(result, null, 2));
//# sourceMappingURL=test-plan-scratch.js.map
