import { getSupabase } from "@/lib/supabase";

type Session = {
  id: string;
  role: string;
  company_id: string | null;
  company_role: string | null;
};

/**
 * Checks whether a user may access a given project at all.
 *
 * Access is granted when ANY of the following is true:
 *  1. System admin (role === 'admin')
 *  2. Internal user whose company owns the project (company_id match)
 *  3. User has an explicit row in project_memberships for that project
 *     (covers external_viewers and any internal member added individually)
 */
export async function canAccessProject(projectId: string, session: Session): Promise<boolean> {
  if (session.role === "admin") return true;

  const supabase = getSupabase();

  if (session.company_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("company_id")
      .eq("id", projectId)
      .single();

    if (project?.company_id === session.company_id) return true;
  }

  const { data: membership } = await supabase
    .from("project_memberships")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  return !!membership;
}

/**
 * Returns the user's role on a specific project, or null if they have
 * no explicit membership row.
 *
 * Internal company admins are treated as 'project_admin' on every project
 * their company owns even without an explicit row.
 */
export async function getProjectRole(
  projectId: string,
  session: Session
): Promise<"project_admin" | "member" | "external_viewer" | null> {
  if (session.role === "admin") return "project_admin";

  const supabase = getSupabase();

  if (session.company_role === "admin" && session.company_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("company_id")
      .eq("id", projectId)
      .single();

    if (project?.company_id === session.company_id) return "project_admin";
  }

  const { data: membership } = await supabase
    .from("project_memberships")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  if (!membership) return null;
  return membership.role as "project_admin" | "member" | "external_viewer";
}
