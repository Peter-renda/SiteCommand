import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ForwardPCOClient from "./ForwardPCOClient";

export default async function ForwardPCOPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string; changeOrderId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, contractId, changeOrderId } = await params;

  return (
    <ForwardPCOClient
      projectId={id}
      contractId={contractId}
      changeOrderId={changeOrderId}
      role={(session as any).role ?? "member"}
    />
  );
}
