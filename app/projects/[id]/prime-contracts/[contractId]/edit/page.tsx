import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditPrimeContractClient from "./EditPrimeContractClient";

export default async function EditPrimeContractPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, contractId } = await params;
  return <EditPrimeContractClient projectId={id} contractId={contractId} />;
}
