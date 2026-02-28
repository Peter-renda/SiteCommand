import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TasksClient from "./TasksClient";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <TasksClient projectId={id} role={session.role} username={session.username} />;
}
