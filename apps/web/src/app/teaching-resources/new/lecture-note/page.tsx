import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { LectureNoteForm } from "@/components/teaching-resources/lecture-note-form";

export default function NewLectureNotePage() {
  return (
    <PageContainer>
      <PageHeader title="New lecture note" subtitle="Saved as a draft until you submit it for approval." />
      <LectureNoteForm />
    </PageContainer>
  );
}
