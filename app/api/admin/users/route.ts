import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Find companies this admin has invited users to
  const { data: invites } = await supabase
    .from("invitations")
    .select("company_id")
    .eq("invited_by", session.id);

  const companyIds = [...new Set((invites ?? []).map((i) => i.company_id).filter(Boolean))];

  if (companyIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, username, email, role, company_id, company_role, created_at")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  return NextResponse.json(users ?? []);
}
