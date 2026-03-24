import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BIMClient from "./BIMClient";

export default async function BIMViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <BIMClient projectId={id} role={session.role} username={session.username} />;
}
