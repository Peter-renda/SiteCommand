import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewCommitmentClient from "./NewCommitmentClient";

export default async function NewCommitmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { type } = await searchParams;
  const commitmentType =
    type === "purchase_order" ? "purchase_order" : "subcontract";

  return (
    <NewCommitmentClient
      projectId={id}
      commitmentType={commitmentType}
      role={session.role}
      username={session.username}
    />
  );
}
