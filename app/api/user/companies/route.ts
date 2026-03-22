import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // Fetch all org_members rows for this user
  const [{ data: memberships }, { data: userRecord }] = await Promise.all([
    supabase
      .from("org_members")
      .select("org_id, role, companies(id, name)")
      .eq("user_id", session.id),
    supabase
      .from("users")
      .select("company_id, company_role, companies(id, name)")
      .eq("id", session.id)
      .maybeSingle(),
  ]);

  const list: { id: string; name: string; role: string; isCurrent: boolean }[] = [];
  const seen = new Set<string>();

  // Add entries from org_members
  for (const m of memberships ?? []) {
    const company = m.companies as unknown as { id: string; name: string } | null;
    const id = company?.id ?? m.org_id;
    if (!seen.has(id)) {
      seen.add(id);
      list.push({
        id,
        name: company?.name ?? "Unknown",
        role: m.role,
        isCurrent: m.org_id === session.company_id,
      });
    }
  }

  // Also include the user's primary company from users.company_id if not already present
  // (accounts created before org_members existed won't have a row there)
  if (userRecord?.company_id && !seen.has(userRecord.company_id)) {
    const company = userRecord.companies as unknown as { id: string; name: string } | null;
    list.unshift({
      id: company?.id ?? userRecord.company_id,
      name: company?.name ?? "Unknown",
      role: userRecord.company_role ?? "super_admin",
      isCurrent: userRecord.company_id === session.company_id,
    });
  }

  return NextResponse.json(list);
}
