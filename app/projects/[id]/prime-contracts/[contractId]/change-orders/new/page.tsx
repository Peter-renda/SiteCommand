import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewPrimePCOClient from "./NewPrimePCOClient";

export default async function NewPrimePCOPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contractId: string }>;
  searchParams: Promise<{ eventIds?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, contractId } = await params;
  const { eventIds } = await searchParams;

  return (
    <NewPrimePCOClient
      projectId={id}
      contractId={contractId}
      eventIds={eventIds ?? ""}
      createdBy={(session as any).username ?? ""}
      role={(session as any).role ?? "member"}
    />
  );
}
