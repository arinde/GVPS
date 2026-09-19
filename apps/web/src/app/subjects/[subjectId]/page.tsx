import { SubjectDetailView } from "@/components/subjects/subject-detail-view";

export default async function SubjectPage({ params }: PageProps<"/subjects/[subjectId]">) {
  const { subjectId } = await params;
  return <SubjectDetailView subjectId={subjectId} />;
}
