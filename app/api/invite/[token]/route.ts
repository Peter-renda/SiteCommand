import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, email, accepted_at, expires_at, invitation_type, project_id, contact_company, companies(name)")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invitation already used" }, { status: 410 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  }

  const company = invite.companies as unknown as { name: string } | null;

  // For external invites include the project name so the UI shows context
  let projectName: string | null = null;
  if (invite.invitation_type === "external" && invite.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", invite.project_id)
      .single();
    projectName = project?.name ?? null;
  }

  // Check if a SiteCommand account already exists for this email
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle();

  // For external invites: show the contact's own company (e.g. "Smith & Jennings")
  // rather than the inviting company (e.g. "Hamel") in the Company field.
  const displayCompanyName =
    invite.invitation_type === "external" && invite.contact_company
      ? invite.contact_company
      : (company?.name ?? "");

  return NextResponse.json({
    email: invite.email,
    companyName: displayCompanyName,
    invitingCompanyName: company?.name ?? "",
    invitationType: invite.invitation_type ?? "internal",
    projectName,
    hasAccount: !!existingUser,
  });
}
