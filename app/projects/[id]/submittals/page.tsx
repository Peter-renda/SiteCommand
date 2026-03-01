import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubmittalsClient from "./SubmittalsClient";

export default async function SubmittalsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <SubmittalsClient projectId={id} role={session.role} username={session.username} userId={session.id} />;
}
