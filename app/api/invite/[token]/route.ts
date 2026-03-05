import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, email, accepted_at, expires_at, companies(name)")
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

  return NextResponse.json({
    email: invite.email,
    companyName: company?.name ?? "",
  });
}
