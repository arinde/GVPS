import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ExamQuestionsForm } from "@/components/teaching-resources/exam-questions-form";

export default function NewExamQuestionsPage() {
  return (
    <PageContainer>
      <PageHeader title="New exam questions" subtitle="Saved as a draft until you submit it for approval." />
      <ExamQuestionsForm />
    </PageContainer>
  );
}
