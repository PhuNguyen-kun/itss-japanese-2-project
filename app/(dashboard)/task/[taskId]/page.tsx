import { TaskDetail } from "@/components/TaskDetail";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <TaskDetail taskId={taskId} />;
}
