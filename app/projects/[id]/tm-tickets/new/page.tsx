import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewTMTicketClient from "./NewTMTicketClient";

export default async function NewTMTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <NewTMTicketClient projectId={id} username={session.username} />;
}
