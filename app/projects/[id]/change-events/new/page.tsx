import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewChangeEventClient from "./NewChangeEventClient";

export default async function NewChangeEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <NewChangeEventClient projectId={id} />;
}
