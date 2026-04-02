import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditCommitmentClient from "./EditCommitmentClient";

export default async function EditCommitmentPage({
  params,
}: {
  params: Promise<{ id: string; commitmentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, commitmentId } = await params;
  return (
    <EditCommitmentClient
      projectId={id}
      commitmentId={commitmentId}
      role={session.role}
      username={session.username}
    />
  );
}
