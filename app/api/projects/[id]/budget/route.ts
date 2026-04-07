import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("budget_line_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data || [];

  const { data: commitmentCos } = await supabase
    .from("change_orders")
    .select("status, amount, budget_codes")
    .eq("project_id", projectId)
    .eq("type", "commitment")
    .is("deleted_at", null);

  // In-flight statuses → Pending Budget Changes column.
  // Approved → Approved Change Orders (approved_cos) column.
  // Rejected, Void, No Charge, Pending-Not-Proceeding do not affect the budget.
  const pendingStatuses = new Set([
    "draft",
    "pending - in review",
    "pending - not pricing",
    "pending - not proceeding",
    "pending - pricing",
    "pending - proceeding",
    "pending - revised",
  ]);
  const agg = new Map<string, { pending: number; approved: number }>();

  (commitmentCos || []).forEach((co: { status?: string; amount?: number; budget_codes?: string[] }) => {
    const normalized = String(co.status || "").trim().toLowerCase();
    const amount = Number(co.amount || 0);
    if (!Array.isArray(co.budget_codes) || co.budget_codes.length === 0 || !amount) return;
    for (const code of co.budget_codes) {
      if (!code) continue;
      const key = code.trim();
      if (!key) continue;
      const curr = agg.get(key) || { pending: 0, approved: 0 };
      if (pendingStatuses.has(normalized)) curr.pending += amount;
      if (normalized === "approved") curr.approved += amount;
      agg.set(key, curr);
    }
  });

  const enriched = rows.map((row) => {
    const key = String(row.cost_code || "").trim();
    const rollup = agg.get(key);
    if (!rollup) return row;
    return {
      ...row,
      pending_budget_changes: Number(row.pending_budget_changes || 0) + rollup.pending,
      approved_cos: Number(row.approved_cos || 0) + rollup.approved,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const {
    cost_code,
    description,
    original_budget_amount,
    budget_modifications,
    approved_cos,
    pending_budget_changes,
    committed_costs,
    job_to_date_costs,
    commitments_invoiced,
    pending_cost_changes,
    sort_order,
  } = body;

  if (!cost_code?.trim() && !description?.trim()) {
    return NextResponse.json({ error: "Cost code or description is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget_line_items")
    .insert({
      project_id: projectId,
      cost_code: cost_code || "",
      description: description || "",
      original_budget_amount: original_budget_amount ?? 0,
      budget_modifications: budget_modifications ?? 0,
      approved_cos: approved_cos ?? 0,
      pending_budget_changes: pending_budget_changes ?? 0,
      committed_costs: committed_costs ?? 0,
      job_to_date_costs: job_to_date_costs ?? 0,
      commitments_invoiced: commitments_invoiced ?? 0,
      pending_cost_changes: pending_cost_changes ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
