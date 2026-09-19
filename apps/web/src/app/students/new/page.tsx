import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StudentRegistrationView } from "@/components/students/student-registration-view";

export default function RegisterStudentPage() {
  return (
    <PageContainer width="form">
      <PageHeader
        title="Register student"
        subtitle="The admission number is allocated on save. Photographs are taken in a second pass and are not needed now."
      />
      <ContentCard>
        <StudentRegistrationView />
      </ContentCard>
    </PageContainer>
  );
}
