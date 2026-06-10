import { RoadmapView } from "@/components/RoadmapView";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <RoadmapView assignmentId={assignmentId} />;
}
