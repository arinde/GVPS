"use client";

import { stockFeatures, useTable, type ColumnDef, type RowData, type StockFeatures } from "@tanstack/react-table";
import { cn } from "cn";
import { EmptyState } from "@/components/common/empty-state";

/**
 * The one table shell in the app (AGENTS.md §4). Features supply `columns` and
 * `data`; nothing else hand-rolls a <table>.
 *
 * Presentational: it takes rows as props and never fetches. A container reads
 * RTK Query and passes the result down.
 */
export type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<StockFeatures, TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "Nothing to show",
  emptyDescription,
  className,
}: DataTableProps<TData>) {
  // v9 builds the core row model itself and carries any optional model
  // factories (sorted, filtered, paginated) on the features object rather than
  // as a separate option. Those get registered when a view actually needs them.
  const table = useTable({
    features: stockFeatures,
    columns,
    data,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        {/* STITCH-GLOBAL.md §9: #EEF3F7 header with #B9C5CE rules above and
            below, 48px rows, zebra striping, 12px/16px cell padding. */}
        <thead className="bg-canvas">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-input border-y">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="text-muted-foreground h-12 px-4 text-left align-middle text-[13px] font-semibold"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="even:bg-zebra hover:bg-canvas border-border h-12 border-b transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="text-body px-4 py-3 align-middle">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 ? (
        isLoading ? (
          <p className="text-muted-foreground py-12 text-center text-sm" role="status">
            Loading…
          </p>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )
      ) : null}
    </div>
  );
}
