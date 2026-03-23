import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !session.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Query org_members so invited users (who keep their primary company_id)
  // are included alongside native members.
  const { data } = await supabase
    .from("org_members")
    .select("role, users(id, username, email, created_at)")
    .eq("org_id", session.company_id)
    .order("created_at", { ascending: true });

  const members = (data ?? []).map((row: any) => {
    const user = row.users as { id: string; username: string; email: string; created_at: string } | null;
    return {
      id: user?.id,
      username: user?.username,
      email: user?.email,
      created_at: user?.created_at,
      company_role: row.role,
    };
  }).filter((m: any) => m.id);

  return NextResponse.json(members);
}
