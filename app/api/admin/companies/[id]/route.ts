import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabase();

  // Company details
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id, name, subscription_plan, subscription_status, seat_limit, enabled_features, stripe_customer_id, stripe_subscription_id, created_at, billing_owner_id"
    )
    .eq("id", id)
    .single();

  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Members with seats (via org_members)
  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("id, role, created_at, users(id, email, username, first_name, last_name, user_type)")
    .eq("org_id", id)
    .order("created_at", { ascending: true });

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  return NextResponse.json({ company, members: members ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabase();

  const allowed = ["subscription_plan", "subscription_status", "seat_limit", "name", "enabled_features"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
