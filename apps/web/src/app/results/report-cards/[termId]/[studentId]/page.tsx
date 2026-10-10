import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StaffReportCardView } from "@/components/results/staff-report-card-view";

// Next 16 passes route params as a Promise; the server page awaits it.
export default async function ReportCardPage({ params }: PageProps<"/results/report-cards/[termId]/[studentId]">) {
  const { termId, studentId } = await params;
  return (
    <PageContainer>
      <PageHeader title="Report card" />
      <StaffReportCardView termId={termId} studentId={studentId} />
    </PageContainer>
  );
}
