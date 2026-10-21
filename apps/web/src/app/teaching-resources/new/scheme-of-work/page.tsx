import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { SchemeOfWorkForm } from "@/components/teaching-resources/scheme-of-work-form";

export default function NewSchemeOfWorkPage() {
  return (
    <PageContainer>
      <PageHeader title="New scheme of work" subtitle="Saved as a draft until you submit it for approval." />
      <SchemeOfWorkForm />
    </PageContainer>
  );
}
