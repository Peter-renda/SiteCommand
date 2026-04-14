import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// Returns rows shaped for the Buyout Summary Report:
//   one row per (budget_line_item × commitment).
// Line items with no matching commitment produce one row with null commitment fields.

function isMissingScheduleOfValuesColumn(message?: string) {
  return (message || "").includes("column change_orders.schedule_of_values does not exist");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  // ── 1. Budget line items ────────────────────────────────────────────────────
  const { data: lineItems, error: liError } = await supabase
    .from("budget_line_items")
    .select(
      "id, cost_code, cost_type, description, original_budget_amount, budget_modifications, approved_cos, sort_order"
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (liError) return NextResponse.json({ error: liError.message }, { status: 500 });

  // ── 2. All non-deleted commitments ─────────────────────────────────────────
  const { data: commitments, error: cmtError } = await supabase
    .from("commitments")
    .select("id, number, type, title, contract_company, status")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("number", { ascending: true });

  if (cmtError) return NextResponse.json({ error: cmtError.message }, { status: 500 });

  const commitmentMap = new Map(
    (commitments || []).map((c) => [c.id, c])
  );

  // ── 3. SOV items → amount per (commitment_id × budget_code) ────────────────
  const { data: sovItems, error: sovError } = await supabase
    .from("commitment_sov_items")
    .select("commitment_id, budget_code, amount")
    .eq("project_id", projectId);

  if (sovError) return NextResponse.json({ error: sovError.message }, { status: 500 });

  // sovAmounts[commitmentId][budgetCode] = sum of SOV amounts
  const sovAmounts: Record<string, Record<string, number>> = {};
  for (const row of sovItems || []) {
    if (!row.commitment_id || !row.budget_code) continue;
    if (!sovAmounts[row.commitment_id]) sovAmounts[row.commitment_id] = {};
    sovAmounts[row.commitment_id][row.budget_code] =
      (sovAmounts[row.commitment_id][row.budget_code] ?? 0) + Number(row.amount || 0);
  }

  // budgetCodeToCommitmentIds[budgetCode] = [commitmentId, ...]
  const budgetCodeToCommitmentIds: Record<string, string[]> = {};
  for (const [commitmentId, codeMap] of Object.entries(sovAmounts)) {
    for (const code of Object.keys(codeMap)) {
      if (!budgetCodeToCommitmentIds[code]) budgetCodeToCommitmentIds[code] = [];
      if (!budgetCodeToCommitmentIds[code].includes(commitmentId)) {
        budgetCodeToCommitmentIds[code].push(commitmentId);
      }
    }
  }

  // ── 4. Approved commitment change orders ────────────────────────────────────
  let { data: coData, error: coError } = await supabase
    .from("change_orders")
    .select("commitment_id, amount, budget_codes, schedule_of_values")
    .eq("project_id", projectId)
    .eq("type", "commitment")
    .eq("status", "approved")
    .is("deleted_at", null);

  if (isMissingScheduleOfValuesColumn(coError?.message)) {
    const fallback = await supabase
      .from("change_orders")
      .select("commitment_id, amount, budget_codes")
      .eq("project_id", projectId)
      .eq("type", "commitment")
      .eq("status", "approved")
      .is("deleted_at", null);
    coData = fallback.data;
    coError = fallback.error;
  }
  if (coError) return NextResponse.json({ error: coError.message }, { status: 500 });

  // approvedCOs[commitmentId][budgetCode] = sum of approved CO amounts
  const approvedCOs: Record<string, Record<string, number>> = {};
  for (const co of coData || []) {
    if (!co.commitment_id) continue;
    if (!approvedCOs[co.commitment_id]) approvedCOs[co.commitment_id] = {};

    const sovLines = Array.isArray(co.schedule_of_values) ? co.schedule_of_values : [];
    if (sovLines.length > 0) {
      for (const line of sovLines) {
        const code = String(line?.budget_code || "").trim();
        if (!code) continue;
        approvedCOs[co.commitment_id][code] =
          (approvedCOs[co.commitment_id][code] ?? 0) + Number(line?.amount || 0);
      }
    } else {
      // Legacy: spread CO amount across all budget_codes
      const codes: string[] = Array.isArray(co.budget_codes) ? co.budget_codes : [];
      const share = codes.length > 0 ? Number(co.amount || 0) / codes.length : 0;
      for (const code of codes) {
        if (!code) continue;
        approvedCOs[co.commitment_id][code] =
          (approvedCOs[co.commitment_id][code] ?? 0) + share;
      }
    }
  }

  // ── 5. Build report rows ────────────────────────────────────────────────────
  const rows: Record<string, unknown>[] = [];

  for (const item of lineItems || []) {
    const revisedBudget =
      Number(item.original_budget_amount || 0) +
      Number(item.budget_modifications || 0) +
      Number(item.approved_cos || 0);

    const costCode = String(item.cost_code || "").trim();
    const cmtIds = budgetCodeToCommitmentIds[costCode] ?? [];

    if (cmtIds.length === 0) {
      // No commitment for this line item
      rows.push({
        budget_line_item_id: item.id,
        cost_code: item.cost_code,
        description: item.description,
        cost_type: item.cost_type,
        original_budget_amount: Number(item.original_budget_amount || 0),
        budget_modifications: Number(item.budget_modifications || 0),
        approved_cos: Number(item.approved_cos || 0),
        revised_budget: revisedBudget,
        commitment_id: null,
        commitment_number: null,
        commitment_type: null,
        contract_company: null,
        original_commitment_costs: null,
        approved_commitment_cos: null,
        revised_commitment_costs: null,
        uncommitted_costs: revisedBudget,
      });
    } else {
      // Total revised commitment across all commitments for this cost code
      let totalRevisedCommitment = 0;
      for (const cmtId of cmtIds) {
        const orig = sovAmounts[cmtId]?.[costCode] ?? 0;
        const appCOs = approvedCOs[cmtId]?.[costCode] ?? 0;
        totalRevisedCommitment += orig + appCOs;
      }

      for (let i = 0; i < cmtIds.length; i++) {
        const cmtId = cmtIds[i];
        const cmt = commitmentMap.get(cmtId);
        const origCosts = sovAmounts[cmtId]?.[costCode] ?? 0;
        const appCOs = approvedCOs[cmtId]?.[costCode] ?? 0;
        const revisedCmtCosts = origCosts + appCOs;

        rows.push({
          budget_line_item_id: item.id,
          cost_code: item.cost_code,
          description: item.description,
          cost_type: item.cost_type,
          original_budget_amount: Number(item.original_budget_amount || 0),
          budget_modifications: Number(item.budget_modifications || 0),
          approved_cos: Number(item.approved_cos || 0),
          revised_budget: revisedBudget,
          commitment_id: cmtId,
          commitment_number: cmt?.number ?? null,
          commitment_type: cmt?.type ?? null,
          contract_company: cmt?.contract_company ?? null,
          original_commitment_costs: origCosts,
          approved_commitment_cos: appCOs,
          revised_commitment_costs: revisedCmtCosts,
          // Uncommitted on last commitment row for this line item; others 0
          uncommitted_costs: i === cmtIds.length - 1
            ? revisedBudget - totalRevisedCommitment
            : 0,
        });
      }
    }
  }

  return NextResponse.json(rows);
}
