import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { NativeSelect } from "@/components/common/native-select";
import { DEPARTMENT_LABEL } from "@/components/subjects/subject-labels";
import type { SubjectOffering } from "@/store/api/subjects-api";

export type OfferingColumnsOptions = {
  busyId?: string;
  onTypeChange: (offering: SubjectOffering, isCore: boolean) => void;
  onRemove: (offering: SubjectOffering) => void;
};

const helper = createColumnHelper<StockFeatures, SubjectOffering>();

export function offeringColumns({ busyId, onTypeChange, onRemove }: OfferingColumnsOptions) {
  return [
    helper.accessor((row) => row.classLevel.name, {
      id: "level",
      header: "Class level",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.accessor((row) => (row.stream ? DEPARTMENT_LABEL[row.stream] : "All"), {
      id: "department",
      header: "Department",
    }),
    helper.display({
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <NativeSelect
          aria-label={`Core or elective at ${row.original.classLevel.name}`}
          className="w-36"
          options={[
            { value: "core", label: "Core" },
            { value: "elective", label: "Elective" },
          ]}
          value={row.original.isCore ? "core" : "elective"}
          disabled={busyId === row.original.id}
          onChange={(event) => onTypeChange(row.original, event.target.value === "core")}
        />
      ),
    }),
    helper.display({
      id: "remove",
      header: () => <span className="sr-only">Remove</span>,
      cell: ({ row }) => (
        <AppButton
          variant="ghost"
          size="small"
          aria-label={`Stop offering at ${row.original.classLevel.name}`}
          disabled={busyId === row.original.id}
          onClick={() => onRemove(row.original)}
        >
          <Trash2 aria-hidden="true" />
          Remove
        </AppButton>
      ),
    }),
  ] as ColumnDef<StockFeatures, SubjectOffering, unknown>[];
}
