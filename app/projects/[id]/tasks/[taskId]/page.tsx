import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TaskDetailClient from "./TaskDetailClient";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, taskId } = await params;
  return (
    <TaskDetailClient
      projectId={id}
      taskId={taskId}
      role={session.role}
      username={session.username}
    />
  );
}
