import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getToolLevel } from "@/lib/tool-permissions";
import RFIsClient from "./RFIsClient";

export default async function RFIsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const toolLevel = await getToolLevel(session, id, "rfis");
  return <RFIsClient projectId={id} role={session.role} username={session.username} userId={session.id} toolLevel={toolLevel} />;
}
