import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type SOVRow = {
  id: string;
  commitment_id: string;
  description: string;
  qty: number;
  uom: string;
  unit_cost: number;
  amount: number;
};

type CommitmentRow = {
  id: string;
  type: "subcontract" | "purchase_order";
  number: number;
  title: string;
  contract_company: string;
  status: string;
  deleted_at: string | null;
};

type CommitmentCOSovLine = {
  budget_code?: string | null;
  description?: string | null;
  amount?: number | string | null;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { searchParams } = new URL(req.url);
  const costCode = (searchParams.get("costCode") || "").trim();
  if (!costCode) {
    return NextResponse.json({ error: "costCode is required" }, { status: 400 });
  }

  const { data: sovRows, error: sovError } = await supabase
    .from("commitment_sov_items")
    .select("id, commitment_id, description, qty, uom, unit_cost, amount")
    .eq("project_id", projectId)
    .eq("budget_code", costCode)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (sovError) return NextResponse.json({ error: sovError.message }, { status: 500 });

  const commitmentIds = Array.from(
    new Set((sovRows || []).map((row: { commitment_id: string }) => row.commitment_id).filter(Boolean))
  );

  let commitments: CommitmentRow[] = [];
  if (commitmentIds.length > 0) {
    const { data, error } = await supabase
      .from("commitments")
      .select("id, type, number, title, contract_company, status, deleted_at")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .eq("status", "approved")
      .in("id", commitmentIds)
      .order("number", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    commitments = (data || []) as CommitmentRow[];
  }

  const commitmentMap = new Map(commitments.map((commitment) => [commitment.id, commitment]));

  const grouped = new Map<string, SOVRow[]>();
  for (const row of (sovRows || []) as SOVRow[]) {
    if (!commitmentMap.has(row.commitment_id)) continue;
    const list = grouped.get(row.commitment_id) || [];
    list.push(row);
    grouped.set(row.commitment_id, list);
  }

  const detailed = commitments.map((commitment) => {
    const lines = grouped.get(commitment.id) || [];
    const total = lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
    return {
      ...commitment,
      total_amount: total,
      lines,
    };
  });

  const { data: changeOrders, error: changeOrderError } = await supabase
    .from("change_orders")
    .select("id, number, title, contract_company, amount, commitment_id, budget_codes, schedule_of_values")
    .eq("project_id", projectId)
    .eq("type", "commitment")
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("number", { ascending: true })
    .order("revision", { ascending: true });

  if (changeOrderError) return NextResponse.json({ error: changeOrderError.message }, { status: 500 });

  const filteredCommitmentCos = (changeOrders || [])
    .map((co: {
      id: string;
      number: string;
      title: string;
      contract_company: string;
      amount: number;
      commitment_id: string | null;
      budget_codes?: string[] | null;
      schedule_of_values?: CommitmentCOSovLine[] | null;
    }) => {
      const sovLines = Array.isArray(co.schedule_of_values) ? co.schedule_of_values : [];
      const matchingAmount = sovLines.reduce((sum, line) => {
        if (String(line?.budget_code || "").trim() !== costCode) return sum;
        return sum + Number(line?.amount || 0);
      }, 0);
      const hasLegacyBudgetCode = Array.isArray(co.budget_codes) && co.budget_codes.some((c) => c?.trim() === costCode);
      if (matchingAmount <= 0 && !hasLegacyBudgetCode) return null;
      return {
        id: co.id,
        number: co.number,
        title: co.title,
        contract_company: co.contract_company,
        commitment_id: co.commitment_id,
        amount: matchingAmount > 0 ? matchingAmount : Number(co.amount || 0),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    cost_code: costCode,
    subcontracts: detailed.filter((c) => c.type === "subcontract"),
    purchase_orders: detailed.filter((c) => c.type === "purchase_order"),
    commitment_change_orders: filteredCommitmentCos,
  });
}
