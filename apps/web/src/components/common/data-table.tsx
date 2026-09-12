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
        <thead className="[&_tr]:border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="text-muted-foreground h-10 px-3 text-left align-middle font-medium"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/50 border-b transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 align-middle">
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
