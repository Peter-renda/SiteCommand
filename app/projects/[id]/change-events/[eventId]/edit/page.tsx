import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditChangeEventClient from "./EditChangeEventClient";

export default async function EditChangeEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: projectId, eventId } = await params;
  return <EditChangeEventClient projectId={projectId} eventId={eventId} />;
}
