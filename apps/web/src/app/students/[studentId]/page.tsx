import { StudentProfileView } from "@/components/students/student-profile-view";

// Next 16 passes route params as a Promise; the server page awaits it and
// hands the id to the client view that fetches the record.
export default async function StudentProfilePage({ params }: PageProps<"/students/[studentId]">) {
  const { studentId } = await params;
  return <StudentProfileView studentId={studentId} />;
}
