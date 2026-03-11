import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PunchListDetailClient from "./PunchListDetailClient";

export default async function PunchListDetailPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, itemId } = await params;
  return (
    <PunchListDetailClient
      projectId={id}
      itemId={itemId}
      role={session.role}
      username={session.username}
      userId={session.id}
    />
  );
}
