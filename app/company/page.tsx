import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import CompanyClient from "./CompanyClient";

export default async function CompanyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // System admin has no company — send them to /admin
  if (session.role === "admin") redirect("/admin");

  // Only company admins can access this page
  if (session.company_role !== "admin") redirect("/dashboard");

  if (!session.company_id) redirect("/dashboard");

  const supabase = getSupabase();

  let company = null;
  let members: unknown[] = [];
  let invites: unknown[] = [];

  if (session.company_id) {
    const { data: companyData } = await supabase
      .from("companies")
      .select("id, name, subscription_plan, subscription_status, seat_limit")
      .eq("id", session.company_id)
      .single();
    company = companyData;

    const { data: membersData } = await supabase
      .from("users")
      .select("id, username, email, company_role, created_at")
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: true });
    members = membersData || [];

    const { data: invitesData } = await supabase
      .from("invitations")
      .select("id, email, created_at, expires_at")
      .eq("company_id", session.company_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    invites = invitesData || [];
  }

  return (
    <CompanyClient
      company={company}
      members={members as { id: string; username: string; email: string; company_role: string; created_at: string }[]}
      invites={invites as { id: string; email: string; created_at: string; expires_at: string }[]}
      currentUserId={session.id}
    />
  );
}
