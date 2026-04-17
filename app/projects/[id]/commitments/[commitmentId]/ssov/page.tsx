import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SsovEditClient from "./SsovEditClient";

export default async function SsovEditPage({
  params,
}: {
  params: Promise<{ id: string; commitmentId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, commitmentId } = await params;
  return (
    <SsovEditClient
      projectId={id}
      commitmentId={commitmentId}
      role={session.role}
      username={session.username}
    />
  );
}
