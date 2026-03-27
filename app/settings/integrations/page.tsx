import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isSiteAdmin = session.role === "site_admin";
  const isSuperAdmin = session.company_role === "super_admin";

  // site_admin sees APS platform settings; company super_admin sees their Sage credentials
  if (!isSiteAdmin && !isSuperAdmin) redirect("/settings/account");

  return <IntegrationsClient isSiteAdmin={isSiteAdmin} />;
}
