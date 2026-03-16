import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  // Fetch all estimate items for the project
  const { data: estimateItems, error: fetchError } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("project_id", projectId)
    .order("division_code", { ascending: true })
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!estimateItems || estimateItems.length === 0) {
    return NextResponse.json({ error: "No estimate items found" }, { status: 400 });
  }

  // Map estimate items to budget line items
  const budgetRows = estimateItems.map((item, idx) => ({
    project_id: projectId,
    cost_code: item.cost_code || item.division_code || "",
    description: item.description,
    original_budget_amount: Number(item.total_cost) || 0,
    budget_modifications: 0,
    approved_cos: 0,
    pending_budget_changes: 0,
    committed_costs: 0,
    direct_costs: 0,
    pending_cost_changes: 0,
    forecast_to_complete: 0,
    sort_order: idx,
  }));

  // Delete existing budget items for this project and replace with estimate
  const { error: deleteError } = await supabase
    .from("budget_line_items")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { data: inserted, error: insertError } = await supabase
    .from("budget_line_items")
    .insert(budgetRows)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ count: inserted?.length ?? 0 });
}
