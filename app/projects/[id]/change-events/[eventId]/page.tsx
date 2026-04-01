import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangeEventDetailClient from "./ChangeEventDetailClient";

export default async function ChangeEventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: projectId, eventId } = await params;
  return <ChangeEventDetailClient projectId={projectId} eventId={eventId} />;
}
