import { getSupabase } from "@/lib/supabase";

export type ProjectPermission = "write" | "read_only";

export type ProjectAccessResult = {
  granted: true;
  permission: ProjectPermission;
  orgRole: string;
};

/**
 * Evaluate a user's effective permission on a specific project.
 *
 * Permission hierarchy:
 *   1. super_admin / admin in the owning org → always "write"
 *   2. member in the owning org with a project_memberships row
 *      → use the explicit `permission` column value
 *   3. No org membership or no project membership → throws (403)
 *
 * Usage in an API route:
 *   ```ts
 *   const { permission } = await checkProjectAccess(session.id, projectId);
 *   if (permission === "read_only") {
 *     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   }
 *   ```
 */
export async function checkProjectAccess(
  userId: string,
  projectId: string
): Promise<ProjectAccessResult> {
  const supabase = getSupabase();

  // 1. Fetch the project to get its owning org (company_id)
  const { data: project } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const orgId: string = project.company_id;

  // 2. Check the org_members table first (the new source of truth)
  let orgRole: string | null = null;

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (orgMember) {
    orgRole = orgMember.role;
  } else {
    // Fallback: read from users.company_role for rows not yet in org_members
    // (accounts created before migration 047 ran)
    const { data: user } = await supabase
      .from("users")
      .select("company_id, company_role")
      .eq("id", userId)
      .single();

    if (!user || user.company_id !== orgId) {
      throw new Error("Access Denied: Not a member of this organisation.");
    }
    orgRole = user.company_role ?? "member";
  }

  // 3. Org-level admins bypass all project-level checks → always write
  if (orgRole === "super_admin" || orgRole === "admin") {
    return { granted: true, permission: "write", orgRole };
  }

  // 4. Standard member → check their explicit project-level permission
  const { data: membership } = await supabase
    .from("project_memberships")
    .select("permission, role")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Access Denied: You have not been added to this project.");
  }

  // Prefer the explicit permission column; fall back to legacy role for rows
  // created before migration 047 added the permission column.
  const permission: ProjectPermission =
    (membership.permission as ProjectPermission | null) ??
    (membership.role === "external_viewer" ? "read_only" : "write");

  return { granted: true, permission, orgRole: orgRole! };
}
