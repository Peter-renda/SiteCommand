import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangeEventsClient from "./ChangeEventsClient";

export default async function ChangeEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <ChangeEventsClient projectId={id} role={session.role} />;
}
