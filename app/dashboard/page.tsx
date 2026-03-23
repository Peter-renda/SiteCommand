import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // External users (subcontractors) have their own dedicated portal
  if (session.user_type === "external") redirect("/subcontractor");

  // Demo users bypass subscription check
  if (session.user_type === "demo") {
    return (
      <DashboardClient
        username={session.username}
        email={session.email}
        role={session.role}
        companyRole={session.company_role ?? null}
        userType="demo"
        companyId={session.company_id ?? null}
      />
    );
  }

  if (!session.company_id) redirect("/pricing");

  const supabase = getSupabase();
  const { data: company } = await supabase
    .from("companies")
    .select("subscription_status, stripe_subscription_id")
    .eq("id", session.company_id)
    .single();

  if (!company || (company.stripe_subscription_id && company.subscription_status !== "active")) {
    redirect("/pricing");
  }

  return (
    <DashboardClient
      username={session.username}
      email={session.email}
      role={session.role}
      companyRole={session.company_role ?? null}
      userType={session.user_type ?? "internal"}
      companyId={session.company_id ?? null}
    />
  );
}
