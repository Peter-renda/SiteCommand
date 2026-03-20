import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { ProjectPermission, resolvePermission } from "@/lib/permissions";

/**
 * GET /api/me
 *
 * Returns the authenticated user's live profile including their current
 * organisation role and the full evaluated project list.
 *
 * Unlike the login response (which is computed once and cached in the cookie),
 * this endpoint re-queries the database on every call so it always reflects
 * the latest project memberships — e.g. after an admin has added the user to
 * a new project since their last login.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, username, role, company_id, company_role, user_type")
    .eq("id", session.id)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let organizations: object[] = [];

  if (user.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, stripe_customer_id, subscription_status")
      .eq("id", user.company_id)
      .single();

    if (company) {
      const orgRole = user.company_role as string | null;
      const isAdmin = isCompanyAdmin(orgRole);

      // Admins see all company projects; members see only their assigned ones
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      const projects = (allProjects ?? []) as { id: string; name: string; status: string }[];

      let memberPermissions: Record<string, ProjectPermission> = {};
      if (!isAdmin && projects.length > 0) {
        const { data: memberships } = await supabase
          .from("project_memberships")
          .select("project_id, permission, role")
          .eq("user_id", user.id);

        for (const m of memberships ?? []) {
          memberPermissions[m.project_id] = resolvePermission(m);
        }
      }

      organizations = [
        {
          org_id: company.id,
          name: company.name,
          role: orgRole ?? "member",
          billing: isAdmin
            ? {
                stripe_customer_id: company.stripe_customer_id ?? null,
                subscription_status: company.subscription_status ?? null,
              }
            : null,
          projects: projects
            .filter((p) => isAdmin || memberPermissions[p.id] !== undefined)
            .map((p) => ({
              project_id: p.id,
              name: p.name,
              status: p.status,
              evaluated_permission: isAdmin ? ("write" as const) : memberPermissions[p.id],
            })),
        },
      ];
    }
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    organizations,
  });
}
