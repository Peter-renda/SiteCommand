import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // External users (subcontractors) have their own dedicated portal
  if (session.user_type === "external") redirect("/subcontractor");

  if (session.role !== "admin") {
    if (!session.company_id) redirect("/pricing");

    // Gate the billing owner (super_admin) on subscription status.
    // Regular admins and members belong to the company and can always access.
    if (session.company_role === "super_admin") {
      const supabase = getSupabase();
      const { data: company } = await supabase
        .from("companies")
        .select("subscription_status")
        .eq("id", session.company_id)
        .single();

      if (!company || company.subscription_status !== "active") {
        redirect("/pricing");
      }
    }
  }

  return (
    <DashboardClient
      username={session.username}
      email={session.email}
      role={session.role}
      companyRole={session.company_role ?? null}
      userType={session.user_type ?? "internal"}
    />
  );
}
