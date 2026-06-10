import { TaskComplete } from "@/components/TaskComplete";

export default async function TaskCompletePage({
  params,
}: {
  params: Promise<{ assignmentId: string; taskId: string }>;
}) {
  const { assignmentId, taskId } = await params;
  return <TaskComplete assignmentId={assignmentId} taskId={taskId} />;
}
