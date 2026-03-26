import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  // Use provided contract_number or auto-assign
  let contractNumber: number;
  if (body.contract_number && !isNaN(Number(body.contract_number))) {
    contractNumber = Number(body.contract_number);
  } else {
    const { data: existing } = await supabase
      .from("prime_contracts")
      .select("contract_number")
      .eq("project_id", projectId)
      .order("contract_number", { ascending: false })
      .limit(1);
    contractNumber = existing && existing.length > 0 ? existing[0].contract_number + 1 : 1;
  }

  const { data, error } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      contract_number: contractNumber,
      title: body.title || "",
      owner_client: body.owner_client || "",
      contractor: body.contractor || "",
      architect_engineer: body.architect_engineer || "",
      status: body.status || "Draft",
      executed: body.executed ?? false,
      default_retainage: body.default_retainage ? Number(body.default_retainage) : 0,
      description: body.description || "",
      inclusions: body.inclusions || "",
      exclusions: body.exclusions || "",
      start_date: body.start_date || null,
      estimated_completion_date: body.estimated_completion_date || null,
      actual_completion_date: body.actual_completion_date || null,
      signed_contract_received_date: body.signed_contract_received_date || null,
      contract_termination_date: body.contract_termination_date || null,
      is_private: body.is_private ?? true,
      sov_view_allowed: body.allow_non_admin_sov_view ?? false,
      original_contract_amount: body.original_contract_amount ? Number(body.original_contract_amount) : 0,
      approved_change_orders: 0,
      pending_change_orders: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save SOV items if provided
  if (Array.isArray(body.sov_items) && body.sov_items.length > 0 && data) {
    const rows = body.sov_items.map((item: any, idx: number) => ({
      prime_contract_id: data.id,
      project_id: projectId,
      budget_code: item.budget_code ?? "",
      description: item.description ?? "",
      scheduled_value: Number(item.amount ?? item.scheduled_value ?? 0),
      billed_to_date: Number(item.billed_to_date ?? 0),
      sort_order: idx,
    }));
    await supabase.from("prime_contract_sov_items").insert(rows);
  }

  return NextResponse.json(data);
}
