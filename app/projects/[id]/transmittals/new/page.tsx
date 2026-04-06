import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewTransmittalClient from "./NewTransmittalClient";

export default async function NewTransmittalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <NewTransmittalClient projectId={id} username={session.username} />;
}
