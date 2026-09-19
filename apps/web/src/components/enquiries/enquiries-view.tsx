"use client";

import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ENQUIRY_STATUS_OPTIONS, enquiryColumns } from "@/components/enquiries/enquiry-columns";
import { notify } from "@/lib/notify";
import {
  useListEnquiriesQuery,
  useUpdateEnquiryMutation,
  type Enquiry,
  type EnquiryStatus,
} from "@/store/api/enquiries-api";
import { useUiStore } from "@/stores/ui/use-ui-store";

const FILTERS: { value: EnquiryStatus | ""; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
  { value: "", label: "All" },
];

const TABLE_ID = "enquiries";

/**
 * Admission enquiries sent from the landing page. The office works through
 * the New tab: call the parent, then mark the enquiry Contacted or Closed.
 * Each change is audited.
 */
export function EnquiriesView() {
  // "New" until the person picks another tab; kept in the UI store so it survives leaving the page.
  const filter = (useUiStore((state) => state.tableFilters[TABLE_ID]) ?? "NEW") as EnquiryStatus | "";
  const setTableFilter = useUiStore((state) => state.setTableFilter);
  const { data: enquiries = [], isFetching } = useListEnquiriesQuery(filter);
  const [updateEnquiry, saving] = useUpdateEnquiryMutation();

  async function changeStatus(enquiry: Enquiry, status: EnquiryStatus) {
    try {
      await updateEnquiry({ id: enquiry.id, status, officeNote: enquiry.officeNote ?? undefined }).unwrap();
      const label = ENQUIRY_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
      notify.success(`Enquiry from ${enquiry.parentName} marked ${label.toLowerCase()}`);
    } catch (error) {
      notify.error(error, "Could not update the enquiry.");
    }
  }

  const columns = enquiryColumns({
    savingId: saving.isLoading ? saving.originalArgs?.id : undefined,
    onStatusChange: changeStatus,
  });
  const current = FILTERS.find((option) => option.value === filter)?.label ?? "All";

  return (
    <PageContainer>
      <PageHeader title="Enquiries" subtitle="Admission and tutorial-centre enquiries from the school website." />

      <div role="tablist" aria-label="Filter enquiries" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            role="tab"
            aria-selected={option.value === filter}
            onClick={() => setTableFilter(TABLE_ID, option.value)}
            className="border-input aria-selected:bg-primary aria-selected:border-primary rounded-full border bg-white px-4 py-1.5 text-sm font-medium aria-selected:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>

      <ContentCard flush>
        <DataTable
          columns={columns}
          data={enquiries}
          isLoading={isFetching && enquiries.length === 0}
          emptyTitle={filter ? `No ${current.toLowerCase()} enquiries` : "No enquiries yet"}
          emptyDescription="Enquiries sent from the school website's Admissions section appear here."
        />
      </ContentCard>
    </PageContainer>
  );
}
