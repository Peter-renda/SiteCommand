import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getToolLevel } from "@/lib/tool-permissions";
import RFIDetailClient from "./RFIDetailClient";

export default async function RFIDetailPage({ params }: { params: Promise<{ id: string; rfiId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, rfiId } = await params;
  const toolLevel = await getToolLevel(session, id, "rfis");
  return (
    <RFIDetailClient
      projectId={id}
      rfiId={rfiId}
      username={session.username}
      userId={session.id}
      userEmail={session.email}
      toolLevel={toolLevel}
    />
  );
}
