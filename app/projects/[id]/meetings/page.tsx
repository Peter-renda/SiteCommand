import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MeetingsClient from "./MeetingsClient";

export default async function MeetingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <MeetingsClient projectId={id} role={session.role} username={session.username} />;
}
