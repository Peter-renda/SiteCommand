import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommitmentDetailClient from "./CommitmentDetailClient";

export default async function CommitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; commitmentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, commitmentId } = await params;
  return (
    <CommitmentDetailClient
      projectId={id}
      commitmentId={commitmentId}
      role={session.role}
      username={session.username}
    />
  );
}
