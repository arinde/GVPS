import { EditStudentView } from "@/components/students/edit-student-view";

export default async function EditStudentPage({ params }: PageProps<"/students/[studentId]/edit">) {
  const { studentId } = await params;
  return <EditStudentView studentId={studentId} />;
}
