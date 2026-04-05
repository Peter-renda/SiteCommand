import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkProjectAccess } from "@/lib/permissions";
import NewChangeEventClient from "./NewChangeEventClient";

export default async function NewChangeEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, id);
    if (permission !== "write") redirect(`/projects/${id}/change-events`);
  } catch {
    redirect("/login");
  }

  return <NewChangeEventClient projectId={id} />;
}
