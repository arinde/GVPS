import { PortalChildView } from "@/components/portal/portal-child-view";

export default async function PortalChildPage({ params }: PageProps<"/portal/children/[studentId]">) {
  const { studentId } = await params;
  return <PortalChildView studentId={studentId} />;
}
