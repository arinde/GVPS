import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import type { ParentRow } from "@/store/api/analytics-api";

const helper = createColumnHelper<StockFeatures, ParentRow>();

export const parentColumns = [
  helper.accessor("name", { header: "Parent / guardian" }),
  helper.accessor("phone", { header: "Phone" }),
  helper.accessor("wards", {
    header: "Ward(s)",
    cell: ({ getValue }) => getValue().join(", "),
  }),
] as ColumnDef<StockFeatures, ParentRow, unknown>[];
