import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();

  const { data: companies, error } = await supabase
    .from("companies")
    .select(
      "id, name, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan, seat_limit, created_at, billing_owner_id"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get user counts per company
  const companyIds = (companies ?? []).map((c) => c.id);
  let userCounts: Record<string, number> = {};
  if (companyIds.length > 0) {
    const { data: members } = await supabase
      .from("org_members")
      .select("org_id")
      .in("org_id", companyIds);

    for (const m of members ?? []) {
      userCounts[m.org_id] = (userCounts[m.org_id] ?? 0) + 1;
    }
  }

  const result = (companies ?? []).map((c) => ({
    ...c,
    user_count: userCounts[c.id] ?? 0,
  }));

  return NextResponse.json(result);
}
