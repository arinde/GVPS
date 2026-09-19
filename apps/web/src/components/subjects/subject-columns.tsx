import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppLinkButton } from "@/components/common/app-button";
import { offeredSummary } from "@/components/subjects/subject-labels";
import type { Subject } from "@/store/api/subjects-api";

const helper = createColumnHelper<StockFeatures, Subject>();

export const subjectColumns = [
  helper.accessor("name", {
    header: "Subject",
    cell: ({ row, getValue }) => (
      <Link href={`/subjects/${row.original.id}`} className="text-foreground font-medium hover:underline">
        {getValue()}
      </Link>
    ),
  }),
  helper.accessor("code", {
    header: "Code",
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
  }),
  helper.accessor((row) => offeredSummary(row.offerings), {
    id: "offered",
    header: "Offered at",
    cell: ({ getValue }) => <p className="max-w-md text-xs">{getValue()}</p>,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <AppLinkButton href={`/subjects/${row.original.id}`} variant="secondary" size="small">
        Manage
      </AppLinkButton>
    ),
  }),
] as ColumnDef<StockFeatures, Subject, unknown>[];
