import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PunchListClient from "./PunchListClient";

export default async function PunchListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <PunchListClient projectId={id} role={session.role} username={session.username} userId={session.id} />;
}
