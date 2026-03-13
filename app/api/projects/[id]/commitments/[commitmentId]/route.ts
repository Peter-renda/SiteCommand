import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const allowed = [
    "type",
    "contract_company",
    "title",
    "erp_status",
    "status",
    "executed",
    "default_retainage",
    "assigned_to",
    "bill_to",
    "payment_terms",
    "ship_to",
    "ship_via",
    "description",
    "delivery_date",
    "signed_po_received_date",
    "is_private",
    "sov_view_allowed",
    "ssov_status",
    "original_contract_amount",
    "approved_change_orders",
    "pending_change_orders",
    "draft_amount",
    "subcontract_cover_letter",
    "bond_amount",
    "exhibit_a_scope",
    "trades",
    "subcontractor_contact",
    "subcontract_type",
    "show_cover_letter",
    "show_executed_cover_letter",
    "sov_accounting_method",
    "sort_order",
    "deleted_at",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("commitments")
    .update(updates)
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const supabase = getSupabase();

  // Soft delete
  const { error } = await supabase
    .from("commitments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commitmentId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
