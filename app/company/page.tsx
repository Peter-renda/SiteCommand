import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { isCompanyAdmin } from "@/lib/project-access";
import CompanyClient from "./CompanyClient";

export default async function CompanyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // System admin has no company — send them to /admin
  if (session.role === "admin") redirect("/admin");

  // Both super_admin and admin can access the team management page
  if (!isCompanyAdmin(session.company_role)) redirect("/dashboard");

  if (!session.company_id) redirect("/dashboard");

  const supabase = getSupabase();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, subscription_plan, subscription_status, seat_limit, billing_owner_id")
    .eq("id", session.company_id)
    .single();

  const { data: members } = await supabase
    .from("users")
    .select("id, username, email, company_role, created_at")
    .eq("company_id", session.company_id)
    .order("created_at", { ascending: true });

  const { data: invites } = await supabase
    .from("invitations")
    .select("id, email, invited_role, created_at, expires_at")
    .eq("company_id", session.company_id)
    .eq("invitation_type", "internal")
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const isSuperAdmin = session.company_role === "super_admin";

  return (
    <CompanyClient
      company={company ?? null}
      members={(members ?? []) as { id: string; username: string; email: string; company_role: string; created_at: string }[]}
      invites={(invites ?? []) as { id: string; email: string; invited_role: string; created_at: string; expires_at: string }[]}
      currentUserId={session.id}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
