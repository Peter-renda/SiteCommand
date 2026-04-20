import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DrawingsClient from "./DrawingsClient";

export default async function DrawingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <DrawingsClient projectId={id} role={session.role} username={session.username} userId={session.id} />;
}
