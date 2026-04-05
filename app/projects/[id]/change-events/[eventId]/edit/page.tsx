import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkProjectAccess } from "@/lib/permissions";
import EditChangeEventClient from "./EditChangeEventClient";

export default async function EditChangeEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: projectId, eventId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") redirect(`/projects/${projectId}/change-events/${eventId}`);
  } catch {
    redirect("/login");
  }

  return <EditChangeEventClient projectId={projectId} eventId={eventId} />;
}
