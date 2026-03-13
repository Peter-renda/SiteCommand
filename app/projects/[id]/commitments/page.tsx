import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommitmentsClient from "./CommitmentsClient";

export default async function CommitmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return (
    <CommitmentsClient
      projectId={id}
      role={session.role}
      username={session.username}
    />
  );
}
