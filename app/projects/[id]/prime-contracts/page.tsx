import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PrimeContractsClient from "./PrimeContractsClient";

export default async function PrimeContractsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return (
    <PrimeContractsClient
      projectId={id}
      role={session.role}
      username={session.username}
    />
  );
}
