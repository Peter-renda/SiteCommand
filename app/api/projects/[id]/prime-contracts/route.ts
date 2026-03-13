import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*, prime_contract_sov_items(*)")
    .eq("project_id", projectId)
    .order("number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const {
    number,
    owner_client,
    title,
    status,
    executed,
    default_retainage,
    contractor,
    architect_engineer,
    description,
    inclusions,
    exclusions,
    start_date,
    estimated_completion_date,
    actual_completion_date,
    signed_contract_received_date,
    contract_termination_date,
    is_private,
    sov_items,
  } = body;

  const { data: contract, error: contractError } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      number: number || null,
      owner_client: owner_client || null,
      title: title || null,
      erp_status: "Not Ready",
      status: status || "Draft",
      executed: executed ?? false,
      original_contract_amount: 0,
      approved_change_orders: 0,
      pending_change_orders: 0,
      draft_change_orders: 0,
      invoiced: 0,
      payments_received: 0,
      default_retainage: default_retainage ?? null,
      contractor: contractor || null,
      architect_engineer: architect_engineer || null,
      description: description || null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      start_date: start_date || null,
      estimated_completion_date: estimated_completion_date || null,
      actual_completion_date: actual_completion_date || null,
      signed_contract_received_date: signed_contract_received_date || null,
      contract_termination_date: contract_termination_date || null,
      is_private: is_private ?? true,
    })
    .select()
    .single();

  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 500 });

  // Insert SOV items if any
  if (sov_items && sov_items.length > 0) {
    const sovRows = sov_items.map((item: { budget_code?: string; description?: string; amount?: number }, i: number) => ({
      contract_id: contract.id,
      project_id: projectId,
      budget_code: item.budget_code || "",
      description: item.description || "",
      amount: item.amount ?? 0,
      billed_to_date: 0,
      sort_order: i,
    }));
    await supabase.from("prime_contract_sov_items").insert(sovRows);
  }

  return NextResponse.json(contract);
}
