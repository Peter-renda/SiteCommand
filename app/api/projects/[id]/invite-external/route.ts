import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getProjectRole } from "@/lib/project-access";
import { sendInviteEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/invite-external
 *
 * Invites a user from *outside* Hamel Builders (or any other company) to
 * collaborate on a specific project with the 'external_viewer' role.
 *
 * The invited person can:
 *   ✓ View this project and its content (RFIs, submittals, etc.)
 *   ✗ Create new projects
 *   ✗ See any other Hamel projects they were not explicitly invited to
 *   ✗ Manage company members or billing
 *
 * Required: caller must be a project_admin on this project (which means
 * they are either a system admin or a company admin, or were given
 * project_admin rights explicitly).
 *
 * Body: { email: string }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const callerRole = await getProjectRole(projectId, session);
  if (callerRole !== "project_admin") {
    return NextResponse.json(
      { error: "Only project admins may invite external collaborators" },
      { status: 403 }
    );
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const supabase = getSupabase();

  // Fetch project + owning company for context
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  await sendInviteEmail(email, inviteUrl, company?.name ?? "");

  return NextResponse.json({ success: true });
}
