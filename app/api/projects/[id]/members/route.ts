import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getProjectRole } from "@/lib/project-access";
import { addUserToDirectory } from "@/lib/directory";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/members
 * List all members of a project with their roles.
 * Accessible by: system admin, company admin, any project member.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const role = await getProjectRole(projectId, session);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();

  const { data: memberships, error } = await supabase
    .from("project_memberships")
    .select("id, role, created_at, user_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch members", detail: error.message }, { status: 500 });
  if (!memberships?.length) return NextResponse.json([]);

  const userIds = memberships.map((m) => m.user_id).filter(Boolean);
  const { data: users } = await supabase
    .from("users")
    .select("id, username, first_name, last_name, email, company_id, user_type")
    .in("id", userIds);

  const usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));
  const data = memberships.map((m) => ({ ...m, users: usersById[m.user_id] ?? null }));

  return NextResponse.json(data);
}

/**
 * POST /api/projects/[id]/members
 * Add an existing internal user to this project with a given role.
 * Only company admins and project_admins may add members.
 *
 * Body: { userId: string, role?: "project_admin" | "member" }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const callerRole = await getProjectRole(projectId, session);
  if (callerRole !== "project_admin") {
    return NextResponse.json({ error: "Only project admins may manage members" }, { status: 403 });
  }

  const { userId, role = "member" } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  // Prevent elevating external viewers via this endpoint
  const allowedRoles = ["project_admin", "member"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = getSupabase();

  // The user being added must belong to the same company as the project
  const { data: project } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  const { data: targetUser } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", userId)
    .single();

  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!project || targetUser.company_id !== project.company_id) {
    return NextResponse.json(
      { error: "User does not belong to this project's company. Use the external invite endpoint instead." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("project_memberships")
    .upsert(
      { project_id: projectId, user_id: userId, company_id: project.company_id, role, invited_by: session.id },
      { onConflict: "project_id,user_id" }
    );

  if (error) return NextResponse.json({ error: "Failed to add member" }, { status: 500 });

  await addUserToDirectory(supabase, projectId, userId);

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/projects/[id]/members
 * Remove a user from this project.
 * Only project_admins may remove members.
 *
 * Body: { userId: string }
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const callerRole = await getProjectRole(projectId, session);
  if (callerRole !== "project_admin") {
    return NextResponse.json({ error: "Only project admins may manage members" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("project_memberships")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  return NextResponse.json({ success: true });
}
