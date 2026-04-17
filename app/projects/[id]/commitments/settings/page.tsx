import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommitmentSettingsClient from "./CommitmentSettingsClient";

export default async function CommitmentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return (
    <CommitmentSettingsClient
      projectId={id}
      role={session.role}
      username={session.username}
    />
  );
}
