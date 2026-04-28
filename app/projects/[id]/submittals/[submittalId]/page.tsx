import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubmittalDetailClient from "./SubmittalDetailClient";

export default async function SubmittalDetailPage({ params }: { params: Promise<{ id: string; submittalId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, submittalId } = await params;
  return (
    <SubmittalDetailClient
      projectId={id}
      submittalId={submittalId}
      role={session.role}
      username={session.username}
      userId={session.id}
      userEmail={session.email}
    />
  );
}
