import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewPrimePCOClient from "./NewPrimePCOClient";

export default async function NewPrimePCOPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contractId: string }>;
  searchParams: Promise<{ eventIds?: string; lineItemIds?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const sessionUser = session as { username?: string; role?: string };

  const { id, contractId } = await params;
  const { eventIds, lineItemIds } = await searchParams;

  return (
    <NewPrimePCOClient
      projectId={id}
      contractId={contractId}
      eventIds={eventIds ?? ""}
      lineItemIds={lineItemIds ?? ""}
      createdBy={sessionUser.username ?? ""}
      role={sessionUser.role ?? "member"}
    />
  );
}
