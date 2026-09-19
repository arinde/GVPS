import { AddStaffView } from "@/components/staff/add-staff-view";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";

export default function NewStaffPage() {
  return (
    <PageContainer width="form">
      <PageHeader
        title="Create staff account"
        subtitle="Superadmin only. The new account gets a one-time temporary password."
      />
      <ContentCard>
        <AddStaffView />
      </ContentCard>
    </PageContainer>
  );
}
