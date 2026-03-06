import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import InsightsClient from "./InsightsClient";

export default async function InsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <InsightsClient projectId={id} role={session.role} username={session.username} />;
}
