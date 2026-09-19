import { StaffProfileView } from "@/components/staff/staff-profile-view";

export default async function StaffProfilePage({ params }: PageProps<"/staff/[staffId]">) {
  const { staffId } = await params;
  return <StaffProfileView staffId={staffId} />;
}
