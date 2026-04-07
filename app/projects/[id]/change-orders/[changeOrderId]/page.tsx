import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangeOrderDetailClient from "./ChangeOrderDetailClient";

export default async function ChangeOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; changeOrderId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, changeOrderId } = await params;
  return (
    <ChangeOrderDetailClient
      projectId={id}
      changeOrderId={changeOrderId}
      username={(session as any).username ?? ""}
      role={session.role}
    />
  );
}
