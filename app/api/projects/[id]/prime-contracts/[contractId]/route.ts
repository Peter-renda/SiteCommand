import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contractId } = await params;
  const supabase = getSupabase();

  const { data: contract, error } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("id", contractId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (error || !contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sovItems } = await supabase
    .from("prime_contract_sov_items")
    .select("*")
    .eq("prime_contract_id", contractId)
    .order("sort_order", { ascending: true });

  const { data: changeOrders } = await supabase
    .from("change_orders")
    .select("status, amount")
    .eq("prime_contract_id", contractId)
    .eq("type", "prime")
    .is("deleted_at", null);

  const originalContractAmount = (sovItems ?? []).reduce((s, i) => s + (i.scheduled_value ?? 0), 0);
  const approvedCO = (changeOrders ?? []).filter((co) => co.status === "Approved").reduce((s, co) => s + (co.amount ?? 0), 0);
  const pendingCO = (changeOrders ?? []).filter((co) => co.status === "Pending").reduce((s, co) => s + (co.amount ?? 0), 0);
  const draftCO = (changeOrders ?? []).filter((co) => co.status === "Draft").reduce((s, co) => s + (co.amount ?? 0), 0);

  return NextResponse.json({
    ...contract,
    sov_items: sovItems ?? [],
    original_contract_amount: originalContractAmount,
    approved_change_orders: approvedCO,
    pending_change_orders: pendingCO,
    draft_change_orders: draftCO,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contractId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  // Strip non-column keys before updating
  const { sov_items, ...fields } = body;

  const { data, error } = await supabase
    .from("prime_contracts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contractId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("prime_contracts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
