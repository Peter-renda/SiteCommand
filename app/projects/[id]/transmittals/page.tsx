import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TransmittalsClient from "./TransmittalsClient";

export default async function TransmittalsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <TransmittalsClient projectId={id} role={session.role} username={session.username} userId={session.id} />;
}
