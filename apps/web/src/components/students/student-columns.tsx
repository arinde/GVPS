import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import type { StudentListRow } from "@/store/api/students-api";

const helper = createColumnHelper<StockFeatures, StudentListRow>();

/** Column definitions are data, kept beside the feature (AGENTS.md §4). */
export const studentColumns = [
  helper.accessor("admissionNo", {
    header: "Admission no.",
    // Monospace so numbers line up down the column and a transposed digit is
    // visible at a glance.
    cell: (context) => <span className="font-mono text-xs">{context.getValue()}</span>,
  }),
  helper.display({
    id: "name",
    header: "Name",
    cell: (context) => {
      const student = context.row.original;
      return (
        <span>
          <Link href={`/students/${student.id}`} className="text-foreground font-medium hover:underline">
            {student.lastName}, {student.firstName}
          </Link>
          {student.otherNames ? <span className="text-muted-foreground"> {student.otherNames}</span> : null}
        </span>
      );
    },
  }),
  helper.display({
    id: "class",
    header: "Class",
    cell: (context) => {
      // The active enrolment, not the level they were admitted into years ago
      // (PLAN.md §4.2 — the class lives on the enrolment).
      const enrolment = context.row.original.enrolments[0];
      return enrolment ? `${enrolment.classArm.classLevel.name}${enrolment.classArm.name}` : "—";
    },
  }),
  helper.accessor("sex", {
    header: "Sex",
    cell: (context) => (context.getValue() === "FEMALE" ? "F" : "M"),
  }),
] as ColumnDef<StockFeatures, StudentListRow, unknown>[];
