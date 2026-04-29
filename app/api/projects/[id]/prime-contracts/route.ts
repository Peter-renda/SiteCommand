import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, "prime_contracts", "read_only");
  if (denied) return denied;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contracts = data || [];

  // Fetch SOV totals per contract
  const { data: sovItems } = await supabase
    .from("prime_contract_sov_items")
    .select("prime_contract_id, scheduled_value")
    .eq("project_id", projectId);

  // Fetch change orders per contract
  const { data: changeOrders } = await supabase
    .from("change_orders")
    .select("prime_contract_id, status, amount")
    .eq("project_id", projectId)
    .eq("type", "prime")
    .is("deleted_at", null);

  // Build SOV sum map: contractId -> total scheduled_value
  const sovMap: Record<string, number> = {};
  for (const item of sovItems ?? []) {
    if (!item.prime_contract_id) continue;
    sovMap[item.prime_contract_id] = (sovMap[item.prime_contract_id] ?? 0) + (item.scheduled_value ?? 0);
  }

  // Build change order sum map: contractId -> { Approved, Pending, Draft }
  const coMap: Record<string, { Approved: number; Pending: number; Draft: number }> = {};
  for (const co of changeOrders ?? []) {
    if (!co.prime_contract_id) continue;
    if (!coMap[co.prime_contract_id]) coMap[co.prime_contract_id] = { Approved: 0, Pending: 0, Draft: 0 };
    if (co.status === "Approved") coMap[co.prime_contract_id].Approved += co.amount ?? 0;
    else if (co.status === "Pending") coMap[co.prime_contract_id].Pending += co.amount ?? 0;
    else if (co.status === "Draft") coMap[co.prime_contract_id].Draft += co.amount ?? 0;
  }

  const enriched = contracts.map((c) => ({
    ...c,
    original_contract_amount: sovMap[c.id] ?? 0,
    approved_change_orders: coMap[c.id]?.Approved ?? 0,
    pending_change_orders: coMap[c.id]?.Pending ?? 0,
    draft_change_orders: coMap[c.id]?.Draft ?? 0,
  }));

  return NextResponse.json(enriched);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, "prime_contracts", "admin");
  if (denied) return denied;
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
    const rows = body.sov_items.map((item: { budget_code?: string; description?: string; amount?: number | string; scheduled_value?: number | string; billed_to_date?: number | string }, idx: number) => ({
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

  if (data) {
    const fieldLabels: Record<string, string> = {
      contract_number: "Contract Number",
      title: "Title",
      owner_client: "Owner Client",
      contractor: "Contractor",
      architect_engineer: "Architect/Engineer",
      status: "Status",
      executed: "Executed",
      default_retainage: "Default Retainage",
      description: "Description",
      inclusions: "Inclusions",
      exclusions: "Exclusions",
      start_date: "Start Date",
      estimated_completion_date: "Estimated Completion Date",
      actual_completion_date: "Actual Completion Date",
      signed_contract_received_date: "Signed Contract Received Date",
      contract_termination_date: "Contract Termination Date",
      is_private: "Private",
      sov_view_allowed: "Allow Non-Admin SOV View",
      original_contract_amount: "Original Contract Amount",
    };
    const historyRows = Object.keys(fieldLabels)
      .filter((k) => String((data as Record<string, unknown>)[k] ?? "").trim() !== "")
      .map((k) => ({
        prime_contract_id: data.id,
        project_id: projectId,
        changed_by: session.id,
        changed_by_name: session.username,
        action: `Updated ${fieldLabels[k]}`,
        field_name: k,
        from_value: "",
        to_value: String((data as Record<string, unknown>)[k] ?? ""),
      }));
    if (historyRows.length > 0) {
      await supabase.from("prime_contract_change_history").insert(historyRows);
    }
  }

  return NextResponse.json(data);
}
