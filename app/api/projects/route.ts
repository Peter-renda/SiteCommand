import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import { addUserToDirectory } from "@/lib/directory";
import { sendProjectMemberInviteEmail } from "@/lib/email";

/** Attach a `has_schedule` flag to each project (one query for the whole set). */
async function withSchedules(
  supabase: SupabaseClient,
  projects: Array<{ id: string; [k: string]: unknown }>,
) {
  if (projects.length === 0) return [];
  const { data: schedules } = await supabase
    .from("project_schedules")
    .select("project_id")
    .in("project_id", projects.map((p) => p.id));
  const scheduled = new Set((schedules ?? []).map((row: { project_id: string }) => row.project_id));
  return projects.map((p) => ({ ...p, has_schedule: scheduled.has(p.id) }));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // The user's own training sandboxes (is_training = true) now surface in their
  // project list alongside regular projects — the platform is training-first, so
  // a launched sandbox is "saved under Projects". They stay scoped to the user
  // who launched them (training_owner_id), so an org admin still won't see other
  // people's sandboxes cluttering their list. (Training → Practice keeps its own
  // dedicated view via GET /api/training/projects.)
  const ownSandboxes = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("is_training", true)
      .eq("training_owner_id", session.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    return Array.isArray(data) ? data : [];
  };

  // Merge the "regular" project set (which always excludes is_training rows) with
  // the user's sandboxes, newest first, then attach schedule flags in one pass.
  const respond = async (
    regular: Array<{ id: string; created_at?: string; [k: string]: unknown }>,
  ) => {
    const merged = [...regular, ...(await ownSandboxes())].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );
    return NextResponse.json(await withSchedules(supabase, merged));
  };

  // Org-level admins see all projects under their company
  const isOrgAdmin =
    session.company_role === "super_admin" || session.company_role === "admin";

  if (session.company_id && isOrgAdmin) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", session.company_id)
      .eq("is_training", false)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    return respond(Array.isArray(data) ? data : []);
  }

  // Standard members and external collaborators: only projects explicitly assigned
  const { data: memberships } = await supabase
    .from("project_memberships")
    .select("project_id")
    .eq("user_id", session.id);

  if (!memberships || memberships.length === 0) return respond([]);

  const projectIds = memberships.map((m: { project_id: string }) => m.project_id);
  let projectQuery = supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .eq("is_training", false)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  // Internal users with a company_id should only see projects from their company
  // (guards against stale/erroneous cross-company memberships)
  if (session.company_id) {
    projectQuery = projectQuery.eq("company_id", session.company_id);
  }

  const { data } = await projectQuery;
  return respond(Array.isArray(data) ? data : []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  // External collaborators (no company) may never create projects.
  // Only system admins and internal company admins can.
  const canCreate =
    session?.company_role === "admin" ||
    session?.company_role === "super_admin";
  if (!session || !canCreate || !session.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name, description, address, zip_code, city, state, county,
    project_number, sector, value, status,
    start_date, actual_start_date, completion_date,
    projected_finish_date, warranty_start_date, warranty_end_date,
    memberIds,
  } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name, description, address, zip_code, city, state, county,
      project_number, sector,
      value: parseFloat(value) || 0,
      status: status || "bidding",
      start_date: start_date || null,
      actual_start_date: actual_start_date || null,
      completion_date: completion_date || null,
      projected_finish_date: projected_finish_date || null,
      warranty_start_date: warranty_start_date || null,
      warranty_end_date: warranty_end_date || null,
      company_id: session.company_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create project" }, { status: 500 });

  // Add initial members to project_memberships and directory
  if (Array.isArray(memberIds) && memberIds.length > 0) {
    const companyId = session.company_id;
    await supabase.from("project_memberships").insert(
      memberIds.map((uid: string) => ({
        project_id: project.id,
        user_id: uid,
        company_id: companyId,
        role: "member",
        permission: "write",
        invited_by: session.id,
      }))
    );
    const contactIds = await Promise.all(
      memberIds.map((uid: string) => addUserToDirectory(supabase, project.id, uid))
    );

    // Auto-fill the Project leads tile from the members added at creation so
    // the new project doesn't start with an empty team panel. Admins can
    // re-assign roles afterwards from the project home page.
    const leadContactIds = contactIds.filter((id): id is string => !!id);
    if (leadContactIds.length > 0) {
      await supabase
        .from("projects")
        .update({ project_roles: { "Project Manager": leadContactIds } })
        .eq("id", project.id);
    }

    const [{ data: invitedUsers }, { data: companyData }] = await Promise.all([
      supabase
        .from("users")
        .select("email, first_name, last_name, username")
        .in("id", memberIds),
      supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .single(),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptInviteUrl = `${appUrl}/login`;
    const resourcesUrl = `${appUrl}/resources`;
    const companyName = companyData?.name || "Your company";

    await Promise.allSettled(
      (invitedUsers ?? [])
        .filter((u: { email?: string | null }) => !!u.email)
        .map((u: { email: string; first_name?: string | null; last_name?: string | null; username?: string | null }) => {
          const recipientName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "there";
          return sendProjectMemberInviteEmail(
            u.email,
            recipientName,
            companyName,
            project.name,
            acceptInviteUrl,
            resourcesUrl,
          );
        })
    );
  }

  // Always add the company super admin(s) to the new project's directory
  if (session.company_id) {
    const { data: superAdmins } = await supabase
      .from("users")
      .select("id")
      .eq("company_id", session.company_id)
      .eq("company_role", "super_admin");
    await Promise.all(
      (superAdmins ?? []).map((u: { id: string }) => addUserToDirectory(supabase, project.id, u.id))
    );
  }

  const companyId = session.company_id;
  if (companyId) {
    dispatchWebhookEvent(companyId, "project.created", {
      id: project.id,
      name: project.name,
      status: project.status,
    }).catch(() => {});
  }

  return NextResponse.json({ ...project, members: [] });
}
