import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewCommitmentCOClient from "./NewCommitmentCOClient";

export default async function NewCommitmentCOPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; commitmentId: string }>;
  searchParams: Promise<{ eventIds?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, commitmentId } = await params;
  const { eventIds } = await searchParams;

  return (
    <NewCommitmentCOClient
      projectId={id}
      commitmentId={commitmentId}
      eventIds={eventIds ?? ""}
      createdBy={(session as any).username ?? ""}
      role={session.role}
    />
  );
}
