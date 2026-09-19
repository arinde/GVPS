import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { TextInput } from "@/components/common/text-input";

export type ClassRow = { id: string; label: string; section: string; capacity: number | null };

export type ClassSetupColumnsOptions = {
  /** The class whose size is being saved; its input is disabled until it lands. */
  savingClassId?: string;
  /** Called on blur or Enter with the typed text, only when it differs from the saved size. */
  onCapacityCommit: (row: ClassRow, text: string) => void;
};

const SECTION = {
  NURSERY: "Nursery",
  PRIMARY: "Primary",
  JUNIOR: "Junior secondary",
  SENIOR: "Senior secondary",
} as const;
const helper = createColumnHelper<StockFeatures, ClassRow>();

export function classSetupColumns({ savingClassId, onCapacityCommit }: ClassSetupColumnsOptions) {
  return [
    helper.accessor("label", {
      header: "Class",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.accessor((row) => SECTION[row.section as keyof typeof SECTION] ?? row.section, {
      id: "section",
      header: "Section",
    }),
    helper.display({
      id: "capacity",
      header: "Class size",
      cell: ({ row }) => {
        const saved = row.original.capacity?.toString() ?? "";
        return (
          <TextInput
            // Keyed on the saved size so a refetch resets the field to it.
            key={saved}
            aria-label={`Class size for ${row.original.label}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            placeholder="Not set"
            defaultValue={saved}
            disabled={savingClassId === row.original.id}
            className="w-28"
            onBlur={(event) => {
              if (event.target.value.trim() !== saved) onCapacityCommit(row.original, event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        );
      },
    }),
  ] as ColumnDef<StockFeatures, ClassRow, unknown>[];
}
