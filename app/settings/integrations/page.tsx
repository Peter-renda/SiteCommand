import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "site_admin") redirect("/dashboard");

  return <IntegrationsClient />;
}
