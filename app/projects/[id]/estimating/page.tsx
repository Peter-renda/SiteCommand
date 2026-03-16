import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EstimatingClient from "./EstimatingClient";

export default async function EstimatingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <EstimatingClient projectId={id} />;
}
