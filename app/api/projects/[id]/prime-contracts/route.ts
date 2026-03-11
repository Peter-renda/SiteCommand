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
    .select("*")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  // Auto-increment contract number
  const { data: maxRow } = await supabase
    .from("prime_contracts")
    .select("contract_number")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.contract_number ?? 0) + 1;

  const body = await req.json();
  const {
    owner_client_id,
    title,
    status,
    executed,
    default_retainage,
    contractor_id,
    architect_engineer_id,
    description,
    inclusions,
    exclusions,
    start_date,
    estimated_completion_date,
    actual_completion_date,
    signed_contract_received_date,
    contract_termination_date,
    is_private,
    non_admin_access,
    allow_non_admin_sov_view,
    accounting_method,
    attachments,
    sov_items,
  } = body;

  if (!status?.trim()) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const { data: contract, error: contractError } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      contract_number: nextNumber,
      owner_client_id: owner_client_id || null,
      title: title || "",
      status: status || "draft",
      executed: executed ?? false,
      default_retainage: default_retainage ?? null,
      contractor_id: contractor_id || null,
      architect_engineer_id: architect_engineer_id || null,
      description: description || null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      start_date: start_date || null,
      estimated_completion_date: estimated_completion_date || null,
      actual_completion_date: actual_completion_date || null,
      signed_contract_received_date: signed_contract_received_date || null,
      contract_termination_date: contract_termination_date || null,
      is_private: is_private ?? true,
      non_admin_access: non_admin_access || [],
      allow_non_admin_sov_view: allow_non_admin_sov_view ?? false,
      accounting_method: accounting_method || "amount",
      attachments: attachments || [],
      created_by: session.id,
    })
    .select()
    .single();

  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 500 });

  // Insert SOV items if provided
  if (Array.isArray(sov_items) && sov_items.length > 0) {
    const rows = sov_items.map((item: Record<string, unknown>, idx: number) => ({
      contract_id: contract.id,
      project_id: projectId,
      item_number: idx + 1,
      group_name: item.group_name || null,
      budget_code: item.budget_code || "",
      description: item.description || "",
      amount: parseFloat(String(item.amount)) || 0,
      billed_to_date: 0,
      sort_order: idx,
    }));

    const { error: sovError } = await supabase.from("prime_contract_sov_items").insert(rows);
    if (sovError) return NextResponse.json({ error: sovError.message }, { status: 500 });
  }

  // Fetch the contract with its SOV items
  const { data: sovItems } = await supabase
    .from("prime_contract_sov_items")
    .select("*")
    .eq("contract_id", contract.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...contract, sov_items: sovItems || [] });
}
