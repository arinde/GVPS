import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";

export type ClassRollRow = { name: string; count: number };

const helper = createColumnHelper<StockFeatures, ClassRollRow>();

export const classRollColumns = [
  helper.accessor("name", { header: "Class" }),
  helper.accessor("count", {
    header: "Students",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),
] as ColumnDef<StockFeatures, ClassRollRow, unknown>[];
