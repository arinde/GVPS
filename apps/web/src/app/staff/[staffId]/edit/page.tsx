import { EditStaffView } from "@/components/staff/edit-staff-view";

export default async function EditStaffPage({ params }: PageProps<"/staff/[staffId]/edit">) {
  const { staffId } = await params;
  return <EditStaffView staffId={staffId} />;
}
