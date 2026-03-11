import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, lineItemId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const allowed = [
    "cost_code",
    "description",
    "original_budget_amount",
    "budget_modifications",
    "approved_cos",
    "pending_budget_changes",
    "committed_costs",
    "direct_costs",
    "pending_cost_changes",
    "forecast_to_complete",
    "sort_order",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("budget_line_items")
    .update(updates)
    .eq("id", lineItemId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, lineItemId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("budget_line_items")
    .delete()
    .eq("id", lineItemId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
