import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MeetingDetailClient from "./MeetingDetailClient";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, meetingId } = await params;
  return (
    <MeetingDetailClient
      projectId={id}
      meetingId={meetingId}
      username={session.username}
    />
  );
}
