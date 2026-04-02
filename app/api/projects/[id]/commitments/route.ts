import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get("deleted") === "true";

  let query = supabase
    .from("commitments")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (includeDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
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
  const {
    type,
    number: requestedNumber,
    contract_company,
    title,
    erp_status,
    status,
    executed,
    default_retainage,
    assigned_to,
    bill_to,
    payment_terms,
    ship_to,
    ship_via,
    description,
    delivery_date,
    signed_po_received_date,
    is_private,
    sov_view_allowed,
    access_user_ids,
    ssov_status,
    original_contract_amount,
    approved_change_orders,
    pending_change_orders,
    draft_amount,
    subcontract_cover_letter,
    bond_amount,
    exhibit_a_scope,
    trades,
    subcontractor_contact,
    subcontract_type,
    show_cover_letter,
    show_executed_cover_letter,
    sov_accounting_method,
    sort_order,
  } = body;

  let nextNumber: number;
  if (requestedNumber != null && Number.isInteger(Number(requestedNumber))) {
    nextNumber = Number(requestedNumber);
  } else {
    // Get next number for this project (includes soft-deleted for uniqueness)
    const { data: existing } = await supabase
      .from("commitments")
      .select("number")
      .eq("project_id", projectId)
      .order("number", { ascending: false })
      .limit(1);

    nextNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;
  }

  const { data, error } = await supabase
    .from("commitments")
    .insert({
      project_id: projectId,
      type: type || "subcontract",
      number: nextNumber,
      contract_company: contract_company || "",
      title: title || "",
      erp_status: erp_status || "not_synced",
      status: status || "draft",
      executed: executed ?? false,
      default_retainage: default_retainage ?? 10,
      assigned_to: assigned_to || "",
      bill_to: bill_to || "",
      payment_terms: payment_terms || "",
      ship_to: ship_to || "",
      ship_via: ship_via || "",
      description: description || "",
      delivery_date: delivery_date || null,
      signed_po_received_date: signed_po_received_date || null,
      is_private: is_private ?? true,
      sov_view_allowed: sov_view_allowed ?? false,
      ssov_status: ssov_status || "",
      original_contract_amount: original_contract_amount ?? 0,
      approved_change_orders: approved_change_orders ?? 0,
      pending_change_orders: pending_change_orders ?? 0,
      draft_amount: draft_amount ?? 0,
      subcontract_cover_letter: subcontract_cover_letter || "",
      bond_amount: bond_amount ?? 0,
      exhibit_a_scope: exhibit_a_scope || "",
      trades: trades || "",
      subcontractor_contact: subcontractor_contact || "",
      subcontract_type: subcontract_type || "",
      show_cover_letter: show_cover_letter ?? false,
      show_executed_cover_letter: show_executed_cover_letter ?? false,
      sov_accounting_method: sov_accounting_method || "unit_quantity",
      sort_order: sort_order ?? nextNumber,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save per-user access list
  if (Array.isArray(access_user_ids) && access_user_ids.length > 0) {
    await supabase.from("commitment_access_users").insert(
      access_user_ids.map((contactId: string) => ({
        commitment_id: data.id,
        directory_contact_id: contactId,
      }))
    );
  }

  return NextResponse.json(data);
}
