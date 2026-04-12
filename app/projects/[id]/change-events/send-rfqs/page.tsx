import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkProjectAccess } from "@/lib/permissions";
import SendRFQsClient from "./SendRFQsClient";

export default async function SendRFQsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventIds?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: projectId } = await params;
  const { eventIds } = await searchParams;

  let canWrite = false;
  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    canWrite = permission === "write";
  } catch {
    redirect("/login");
  }

  return <SendRFQsClient projectId={projectId} canWrite={canWrite} eventIds={eventIds ?? ""} />;
}
