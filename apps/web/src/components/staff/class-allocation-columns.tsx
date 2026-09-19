import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import { StatusPill } from "@/components/common/status-pill";
import type { AllocatedClass } from "@/store/api/staff-api";

export type FormTeacherOption = SelectOption & { load: number };

export type ClassAllocationColumnsOptions = {
  teachers: FormTeacherOption[];
  maxClassesPerTeacher: number;
  /** The class whose change is being saved; its select is disabled until it lands. */
  savingClassId?: string;
  onAssign: (classArmId: string, staffId: string | null) => void;
};

const helper = createColumnHelper<StockFeatures, AllocatedClass>();

/**
 * A teacher already at the limit is left out of other classes' lists rather
 * than offered and then refused by the API — but stays in the list of a class
 * they already hold, so that select can still show them.
 */
function optionsFor(row: AllocatedClass, { teachers, maxClassesPerTeacher }: ClassAllocationColumnsOptions) {
  return teachers
    .filter((teacher) => teacher.value === row.teacher?.id || teacher.load < maxClassesPerTeacher)
    .map(({ value, label, load }) => ({ value, label: `${label} (${load} of ${maxClassesPerTeacher})` }));
}

export function classAllocationColumns(options: ClassAllocationColumnsOptions) {
  return [
    helper.accessor((row) => `${row.classLevel.name}${row.name}`, {
      id: "class",
      header: "Class",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.teacher ? (
          <StatusPill tone="success" shape="circle">
            Allocated
          </StatusPill>
        ) : (
          <StatusPill tone="warning" shape="hollow">
            No teacher
          </StatusPill>
        ),
    }),
    helper.display({
      id: "teacher",
      header: "Form teacher",
      cell: ({ row }) => (
        <NativeSelect
          aria-label={`Form teacher for ${row.original.classLevel.name}${row.original.name}`}
          className="max-w-xs"
          value={row.original.teacher?.id ?? ""}
          placeholder="No teacher"
          options={optionsFor(row.original, options)}
          disabled={options.savingClassId === row.original.id}
          onChange={(event) => options.onAssign(row.original.id, event.target.value || null)}
        />
      ),
    }),
  ] as ColumnDef<StockFeatures, AllocatedClass, unknown>[];
}
