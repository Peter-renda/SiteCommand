import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ContractorClient from "./ContractorClient";

export default async function ContractorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "contractor") redirect("/dashboard");

  return <ContractorClient username={session.username} />;
}
