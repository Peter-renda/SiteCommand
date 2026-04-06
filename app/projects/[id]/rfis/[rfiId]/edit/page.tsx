import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditRFIClient from "./EditRFIClient";

export default async function EditRFIPage({ params }: { params: Promise<{ id: string; rfiId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, rfiId } = await params;

  return <EditRFIClient projectId={id} rfiId={rfiId} userId={session.id} role={session.role} />;
}
