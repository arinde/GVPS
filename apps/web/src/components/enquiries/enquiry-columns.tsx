import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { NativeSelect } from "@/components/common/native-select";
import { formatWhen } from "@/lib/dates";
import type { Enquiry, EnquiryStatus } from "@/store/api/enquiries-api";

export const ENQUIRY_STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
];

export type EnquiryColumnsOptions = {
  /** The enquiry being saved; its select is disabled until it lands. */
  savingId?: string;
  onStatusChange: (enquiry: Enquiry, status: EnquiryStatus) => void;
};

const helper = createColumnHelper<StockFeatures, Enquiry>();

/** "0808 795 9017" -> "tel:+2348087959017". */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function enquiryColumns({ savingId, onStatusChange }: EnquiryColumnsOptions) {
  return [
    helper.accessor("createdAt", {
      header: "Received",
      cell: ({ getValue }) => (
        <time dateTime={getValue()} className="font-mono text-xs">
          {formatWhen(getValue())}
        </time>
      ),
    }),
    helper.display({
      id: "parent",
      header: "From",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground font-medium">{row.original.parentName}</span>
          <a href={telHref(row.original.phone)} className="text-primary text-xs hover:underline">
            {row.original.phone}
          </a>
          {row.original.email ? <span className="text-muted-foreground text-xs">{row.original.email}</span> : null}
        </div>
      ),
    }),
    helper.accessor((row) => row.childName ?? "—", { id: "child", header: "Child" }),
    helper.accessor("interest", { header: "About" }),
    helper.accessor((row) => row.message ?? "—", {
      id: "message",
      header: "Message",
      cell: ({ getValue }) => <p className="max-w-xs text-xs whitespace-pre-line">{getValue()}</p>,
    }),
    helper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <NativeSelect
          aria-label={`Status of the enquiry from ${row.original.parentName}`}
          className="w-36"
          options={ENQUIRY_STATUS_OPTIONS}
          value={row.original.status}
          disabled={savingId === row.original.id}
          onChange={(event) => onStatusChange(row.original, event.target.value as EnquiryStatus)}
        />
      ),
    }),
  ] as ColumnDef<StockFeatures, Enquiry, unknown>[];
}
