import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { email, company } = await req.json();

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const supabase = getSupabase();

  // Verify the caller is a member of this project
  const { data: member } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  if (!member && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve company_id: try by name, fall back to session company
  let company_id: string | null = session.company_id ?? null;

  if (company) {
    const { data: found } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", company.trim())
      .limit(1)
      .maybeSingle();
    if (found) company_id = found.id;
  }

  if (!company_id) {
    return NextResponse.json({ error: "Could not determine company for invitation" }, { status: 400 });
  }

  // Create a new invitation
  const { data: invite, error: inviteErr } = await supabase
    .from("invitations")
    .insert({ company_id, email, invited_by: session.id })
    .select("token")
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json(
      { error: `Failed to create invitation: ${inviteErr?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  // Fetch company name for the email
  const { data: companyRow } = await supabase
    .from("companies")
    .select("name")
    .eq("id", company_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  try {
    await sendInviteEmail(email, inviteUrl, companyRow?.name ?? "");
  } catch (emailErr) {
    const msg = emailErr instanceof Error ? emailErr.message : "Unknown error";
    return NextResponse.json({ error: `Email failed: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
