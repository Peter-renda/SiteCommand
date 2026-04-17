import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type CommitmentCOSovLine = {
  budget_code?: string | null;
  amount?: number | string | null;
};

function isMissingScheduleOfValuesColumn(message?: string) {
  return (message || "").includes("column change_orders.schedule_of_values does not exist");
}

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

  let { data: commitmentCos, error: commitmentCosError } = await supabase
    .from("change_orders")
    .select("status, amount, budget_codes, schedule_of_values")
    .eq("project_id", projectId)
    .eq("type", "commitment")
    .is("deleted_at", null);

  if (isMissingScheduleOfValuesColumn(commitmentCosError?.message)) {
    const fallback = await supabase
      .from("change_orders")
      .select("status, amount, budget_codes")
      .eq("project_id", projectId)
      .eq("type", "commitment")
      .is("deleted_at", null);
    commitmentCos = fallback.data;
    commitmentCosError = fallback.error;
  }

  if (commitmentCosError) return NextResponse.json({ error: commitmentCosError.message }, { status: 500 });

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

  (commitmentCos || []).forEach((co: {
    status?: string;
    amount?: number;
    budget_codes?: string[];
    schedule_of_values?: CommitmentCOSovLine[];
  }) => {
    const normalized = String(co.status || "").trim().toLowerCase();
    const sovLines = Array.isArray(co.schedule_of_values) ? co.schedule_of_values : [];

    if (sovLines.length > 0) {
      for (const line of sovLines) {
        const key = String(line?.budget_code || "").trim();
        const lineAmount = Number(line?.amount || 0);
        if (!key || !lineAmount) continue;
        const curr = agg.get(key) || { pending: 0, approved: 0 };
        if (pendingStatuses.has(normalized)) curr.pending += lineAmount;
        if (normalized === "approved") curr.approved += lineAmount;
        agg.set(key, curr);
      }
      return;
    }

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
    cost_type,
    description,
    manual_calculation,
    unit_qty,
    unit_of_measure,
    unit_cost,
    original_budget_amount,
    budget_modifications,
    approved_cos,
    pending_budget_changes,
    committed_costs,
    job_to_date_costs,
    commitments_invoiced,
    pending_cost_changes,
    start_date,
    end_date,
    curve,
    sort_order,
    is_partial_line_item,
    is_gst_line_item,
  } = body;

  if (!cost_code?.trim()) {
    return NextResponse.json({ error: "Cost code is required" }, { status: 400 });
  }

  if (!cost_type?.trim()) {
    return NextResponse.json({ error: "Cost type is required" }, { status: 400 });
  }

  const normalizedCode = String(cost_code || "").trim();
  const normalizedType = String(cost_type || "").trim();

  const { data: existing, error: existingError } = await supabase
    .from("budget_line_items")
    .select("id")
    .eq("project_id", projectId)
    .eq("cost_code", normalizedCode)
    .eq("cost_type", normalizedType)
    .limit(1);

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if ((existing || []).length > 0) {
    return NextResponse.json(
      { error: "A budget line item already exists for this Cost Code and Cost Type." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("budget_line_items")
    .insert({
      project_id: projectId,
      cost_code: normalizedCode,
      cost_type: normalizedType,
      description: description || "",
      manual_calculation: manual_calculation ?? false,
      unit_qty: unit_qty ?? 0,
      unit_of_measure: unit_of_measure || "",
      unit_cost: unit_cost ?? 0,
      original_budget_amount: original_budget_amount ?? 0,
      budget_modifications: budget_modifications ?? 0,
      approved_cos: approved_cos ?? 0,
      pending_budget_changes: pending_budget_changes ?? 0,
      committed_costs: committed_costs ?? 0,
      job_to_date_costs: job_to_date_costs ?? 0,
      commitments_invoiced: commitments_invoiced ?? 0,
      pending_cost_changes: pending_cost_changes ?? 0,
      start_date: start_date || null,
      end_date: end_date || null,
      curve: curve || "",
      sort_order: sort_order ?? 0,
      is_partial_line_item: Boolean(is_partial_line_item),
      is_gst_line_item: Boolean(is_gst_line_item),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
