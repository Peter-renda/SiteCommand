import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // Fetch org_members and the user's primary company_id in parallel
  const [{ data: memberships }, { data: userRecord }] = await Promise.all([
    supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", session.id),
    supabase
      .from("users")
      .select("company_id, company_role")
      .eq("id", session.id)
      .maybeSingle(),
  ]);

  // Collect all org IDs we need to resolve names for
  const orgIds = new Set<string>();
  for (const m of memberships ?? []) orgIds.add(m.org_id);
  if (userRecord?.company_id) orgIds.add(userRecord.company_id);

  // Fetch company names in one query
  const { data: companiesData } = orgIds.size > 0
    ? await supabase.from("companies").select("id, name").in("id", [...orgIds])
    : { data: [] };
  const companyMap = new Map((companiesData ?? []).map((c) => [c.id, c.name]));

  const list: { id: string; name: string; role: string; isCurrent: boolean }[] = [];
  const seen = new Set<string>();

  // Add entries from org_members
  for (const m of memberships ?? []) {
    if (!seen.has(m.org_id)) {
      seen.add(m.org_id);
      list.push({
        id: m.org_id,
        name: companyMap.get(m.org_id) ?? "Unknown",
        role: m.role,
        isCurrent: m.org_id === session.company_id,
      });
    }
  }

  // Also include the user's primary company from users.company_id if not already present
  // (accounts created before org_members existed won't have a row there)
  if (userRecord?.company_id && !seen.has(userRecord.company_id)) {
    list.unshift({
      id: userRecord.company_id,
      name: companyMap.get(userRecord.company_id) ?? "Unknown",
      role: userRecord.company_role ?? "super_admin",
      isCurrent: userRecord.company_id === session.company_id,
    });
  }

  return NextResponse.json(list);
}
