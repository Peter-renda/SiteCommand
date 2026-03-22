import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role, companies(id, name)")
    .eq("user_id", session.id);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json([]);
  }

  const companies = memberships.map((m) => {
    const company = m.companies as unknown as { id: string; name: string } | null;
    return {
      id: company?.id ?? m.org_id,
      name: company?.name ?? "Unknown",
      role: m.role,
      isCurrent: m.org_id === session.company_id,
    };
  });

  return NextResponse.json(companies);
}
