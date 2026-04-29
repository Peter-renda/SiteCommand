import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

const TRACKED_FIELDS = [
  "contract_number", "title", "owner_client", "contractor", "architect_engineer", "status", "erp_status",
  "executed", "default_retainage", "description", "inclusions", "exclusions",
  "start_date", "estimated_completion_date", "actual_completion_date", "signed_contract_received_date", "contract_termination_date",
  "is_private", "sov_view_allowed", "original_contract_amount", "approved_change_orders", "pending_change_orders", "draft_change_orders",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contractId } = await params;
  const denied = await requireToolLevel(session, projectId, "prime_contracts", "read_only");
  if (denied) return denied;
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
  const denied = await requireToolLevel(session, projectId, "prime_contracts", "admin");
  if (denied) return denied;
  const supabase = getSupabase();
  const body = await req.json();

  // Strip non-column keys before updating
  const { sov_items, ...fields } = body;

  const { data: current } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("id", contractId)
    .eq("project_id", projectId)
    .single();

  const { data, error } = await supabase
    .from("prime_contracts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace SOV items if provided
  if (Array.isArray(sov_items)) {
    await supabase
      .from("prime_contract_sov_items")
      .delete()
      .eq("prime_contract_id", contractId);

    if (sov_items.length > 0) {
      const rows = sov_items.map((item: any, idx: number) => ({
        prime_contract_id: contractId,
        project_id: projectId,
        budget_code: item.budget_code ?? "",
        description: item.description ?? "",
        scheduled_value: Number(item.amount ?? item.scheduled_value ?? 0),
        billed_to_date: Number(item.billed_to_date ?? 0),
        sort_order: idx,
      }));
      await supabase.from("prime_contract_sov_items").insert(rows);
    }
  }

  if (current && data) {
    const labels: Record<string, string> = {
      contract_number: "Contract Number",
      title: "Title",
      owner_client: "Owner Client",
      contractor: "Contractor",
      architect_engineer: "Architect/Engineer",
      status: "Status",
      erp_status: "ERP Status",
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
      approved_change_orders: "Approved Change Orders",
      pending_change_orders: "Pending Change Orders",
      draft_change_orders: "Draft Change Orders",
    };

    const historyRows = TRACKED_FIELDS
      .filter((field) => field in fields && String((current as Record<string, unknown>)[field] ?? "") !== String((data as Record<string, unknown>)[field] ?? ""))
      .map((field) => ({
        prime_contract_id: contractId,
        project_id: projectId,
        changed_by: session.id,
        changed_by_name: session.username,
        action: `Updated ${labels[field] ?? field}`,
        field_name: field,
        from_value: String((current as Record<string, unknown>)[field] ?? ""),
        to_value: String((data as Record<string, unknown>)[field] ?? ""),
      }));
    if (historyRows.length > 0) {
      await supabase.from("prime_contract_change_history").insert(historyRows);
    }
  }

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
