import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { StatusPill } from "@/components/common/status-pill";
import { TYPE_LABELS, type ResourceRow } from "@/components/teaching-resources/resource-row";

const helper = createColumnHelper<StockFeatures, ResourceRow>();

const STATUS_PILL = {
  DRAFT: { tone: "warning", shape: "diamond", label: "Draft" },
  SUBMITTED: { tone: "info", shape: "hollow", label: "Submitted" },
  APPROVED: { tone: "success", shape: "circle", label: "Approved" },
} as const;

export const resourceColumns = [
  helper.display({
    id: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link href={`/teaching-resources/${row.original.id}`} className="text-foreground font-medium hover:underline">
        {row.original.title}
      </Link>
    ),
  }),
  helper.accessor((row) => TYPE_LABELS[row.type], { id: "type", header: "Type" }),
  helper.accessor("subjectName", { header: "Subject" }),
  helper.accessor("classLevelName", { header: "Class" }),
  helper.accessor("termName", { header: "Term" }),
  helper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const pill = STATUS_PILL[row.original.status];
      return (
        <StatusPill tone={pill.tone} shape={pill.shape}>
          {pill.label}
        </StatusPill>
      );
    },
  }),
] as ColumnDef<StockFeatures, ResourceRow, unknown>[];
