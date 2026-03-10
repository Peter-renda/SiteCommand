import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("contractor_invitations")
    .select("id, email, contact_name, accepted_at, expires_at, project_id, projects(name)")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (data.accepted_at) return NextResponse.json({ error: "Invitation already accepted" }, { status: 410 });
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });

  return NextResponse.json({
    email: data.email,
    contactName: data.contact_name,
    projectName: (data.projects as unknown as { name: string } | null)?.name ?? "Unknown Project",
  });
}
