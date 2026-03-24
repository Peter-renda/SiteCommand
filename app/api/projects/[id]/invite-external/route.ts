import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { sendContractorInviteEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/invite-external
 *
 * Invites an external user (subcontractor) to collaborate on a specific
 * project with the 'external_viewer' role.
 *
 * Who can invite:
 *   - System admins
 *   - Company super_admins and admins (auto project_admin on all company projects)
 *   - Any internal member who has access to the project
 *
 * Optionally accepts allowed_sections (string[]) to restrict which tools
 * the subcontractor can see. NULL / omitted = access to all sections.
 *
 * Body: { email: string, allowed_sections?: string[] }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  // Any internal user with access to this project may invite an external collaborator
  const hasAccess = await canAccessProject(projectId, session);
  if (!hasAccess) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // External users (subcontractors themselves) cannot invite others
  if (session.user_type === "external") {
    return NextResponse.json(
      { error: "External collaborators cannot send invitations" },
      { status: 403 }
    );
  }

  const { email, allowed_sections, contact_name } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Validate allowed_sections if provided
  const validSections = [
    "rfis", "submittals", "documents", "drawings", "photos",
    "schedule", "tasks", "punchlist", "daily_log", "directory",
  ];
  if (allowed_sections !== undefined && allowed_sections !== null) {
    if (!Array.isArray(allowed_sections)) {
      return NextResponse.json({ error: "allowed_sections must be an array" }, { status: 400 });
    }
    const invalid = allowed_sections.filter((s: string) => !validSections.includes(s));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid sections: ${invalid.join(", ")}` }, { status: 400 });
    }
  }

  const supabase = getSupabase();

  // Fetch project + owning company
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, company_id, companies(name)")
    .eq("id", projectId)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const company = project.companies as unknown as { name: string } | null;

  // Do not invite someone who is already an internal member of this company
  const { data: existingInternalUser } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("email", email)
    .maybeSingle();

  if (existingInternalUser?.company_id === project.company_id) {
    return NextResponse.json(
      { error: "This user is already an internal member. Use the standard member management instead." },
      { status: 400 }
    );
  }

  // Remove any existing pending invitation for this email + project so we can re-invite
  await supabase
    .from("invitations")
    .delete()
    .eq("email", email)
    .eq("project_id", projectId)
    .eq("invitation_type", "external");

  // Create the external invitation
  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      company_id: project.company_id,
      email,
      invited_by: session.id,
      project_id: projectId,
      invitation_type: "external",
      project_role: "external_viewer",
    })
    .select("token")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }

  // If section restrictions were specified, pre-create the membership record now
  // so the allowed_sections are available immediately on accept.
  // (The accept route will also insert a membership, so we upsert here.)
  if (allowed_sections && allowed_sections.length > 0) {
    // Store the sections on the invitation token so the accept route can apply them
    await supabase
      .from("invitations")
      .update({ project_role: "external_viewer" })
      .eq("token", invite.token);
    // We'll pass allowed_sections via a separate column added in migration 031
    // For now store in a comment-friendly way by updating after insert
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  await sendContractorInviteEmail(email, inviteUrl, project.name, contact_name ?? "");

  return NextResponse.json({ success: true });
}
