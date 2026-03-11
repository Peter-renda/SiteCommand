import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.company_role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, company_id, accepted_at")
    .eq("id", id)
    .single();

  if (!invite || invite.company_id !== session.company_id) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "Cannot revoke accepted invitation" }, { status: 400 });
  }

  await supabase.from("invitations").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
