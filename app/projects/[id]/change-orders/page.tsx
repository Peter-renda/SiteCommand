import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangeOrdersClient from "./ChangeOrdersClient";

export default async function ChangeOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return (
    <ChangeOrdersClient
      projectId={id}
      role={session.role}
      username={session.email}
    />
  );
}
