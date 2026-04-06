import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewMeetingClient from "./NewMeetingClient";

export default async function NewMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <NewMeetingClient projectId={id} username={session.username} />;
}
