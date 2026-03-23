import { getSupabase } from "@/lib/supabase";

type Session = {
  id: string;
  role: string;
  company_id: string | null;
  company_role: string | null;
};

/** Returns true if the company_role is admin-level (super_admin or admin). */
export function isCompanyAdmin(companyRole: string | null): boolean {
  return companyRole === "super_admin" || companyRole === "admin";
}

/**
 * Checks whether a user may access a given project at all.
 *
 * Access is granted when ANY of the following is true:
 *  1. Internal user whose company owns the project (company_id match)
 *  2. User has an explicit row in project_memberships for that project
 *     (covers external_viewers and any internal member added individually)
 */
export async function canAccessProject(projectId: string, session: Session): Promise<boolean> {
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
 * Internal company admins (super_admin or admin) are treated as
 * 'project_admin' on every project their company owns, even without
 * an explicit membership row.
 */
export async function getProjectRole(
  projectId: string,
  session: Session
): Promise<"project_admin" | "member" | "external_viewer" | null> {

  const supabase = getSupabase();

  if (isCompanyAdmin(session.company_role) && session.company_id) {
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

/**
 * Returns the sections a user is permitted to access within a project.
 * Returns null if they have access to all sections (internal members,
 * project admins). Returns an array of section slugs for external_viewers
 * with restricted access.
 */
export async function getAllowedSections(
  projectId: string,
  session: Session
): Promise<string[] | null> {

  const supabase = getSupabase();

  // Internal members whose company owns the project get full access
  if (session.company_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("company_id")
      .eq("id", projectId)
      .single();
    if (project?.company_id === session.company_id) return null;
  }

  const { data: membership } = await supabase
    .from("project_memberships")
    .select("allowed_sections")
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  // No membership → no access to any section
  if (!membership) return [];

  // null means unrestricted; an empty/populated array means restricted
  return membership.allowed_sections ?? null;
}
