import { TeachingResourceDetailView } from "@/components/teaching-resources/teaching-resource-detail-view";

export default async function TeachingResourceDetailPage({ params }: PageProps<"/teaching-resources/[id]">) {
  const { id } = await params;
  return <TeachingResourceDetailView id={id} />;
}
