import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <BudgetClient projectId={id} role={session.role} username={session.username} />;
}
