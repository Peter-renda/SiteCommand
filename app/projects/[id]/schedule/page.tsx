import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <ScheduleClient projectId={id} role={session.role} username={session.username} />;
}
