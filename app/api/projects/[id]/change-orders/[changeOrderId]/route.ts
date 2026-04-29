import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data: initialExisting, error: existingError } = await supabase
    .from("change_orders")
    .select("id, type, erp_status, status, prime_contract_id, number, title")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  let existing = initialExisting as { id: string; type: string; erp_status?: string | null; status?: string | null; prime_contract_id?: string | null; number?: string | null; title?: string | null } | null;

  if (existingError) {
    // If the error is about the erp_status column not existing, retry without it.
    if (/erp_status/i.test(existingError.message || "")) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("change_orders")
        .select("id, type, status, prime_contract_id, number, title")
        .eq("id", changeOrderId)
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .single();

      if (fallbackError || !fallback) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      existing = { ...fallback, erp_status: null };
    } else if (existingError.code === "PGRST116") {
      // No rows matched — genuine not found.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else {
      // Unexpected DB error — surface it rather than masking as "Not found".
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
  }

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    String(existing.type || "").trim().toLowerCase() === "commitment" &&
    String(existing.erp_status || "").trim().toLowerCase() === "synced"
  ) {
    return NextResponse.json(
      { error: "This commitment change order is synced to ERP and cannot be edited." },
      { status: 400 }
    );
  }

  const normalizedExistingStatus = String(existing.status || "").trim().toLowerCase();
  const hasStatusUpdate = typeof body.status === "string";
  const normalizedRequestedStatus = hasStatusUpdate
    ? String(body.status || "").trim().toLowerCase()
    : "";

  if (hasStatusUpdate) {
    if (normalizedRequestedStatus === "approved" && normalizedExistingStatus !== "approved") {
      body.approved_at = new Date().toISOString();
    } else if (normalizedRequestedStatus !== "approved" && normalizedExistingStatus === "approved") {
      body.approved_at = null;
    }
  }

  const { data, error } = await supabase
    .from("change_orders")
    .update(body)
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data && data.type === "prime") {
    const previousPrimeContractId = existing.prime_contract_id ? String(existing.prime_contract_id) : "";
    const nextPrimeContractId = data.prime_contract_id ? String(data.prime_contract_id) : "";

    if (previousPrimeContractId !== nextPrimeContractId) {
      if (previousPrimeContractId) {
        await supabase.from("prime_contract_change_history").insert({
          prime_contract_id: previousPrimeContractId,
          project_id: projectId,
          changed_by: session.id,
          changed_by_name: session.username,
          action: `Removed Change Order #${data.number}`,
          field_name: "change_order_association",
          from_value: String(data.id),
          to_value: "",
          details: `Change order ${data.number} (${data.title || "Untitled"}) is no longer associated to this prime contract.`,
        });
      }

      if (nextPrimeContractId) {
        await supabase.from("prime_contract_change_history").insert({
          prime_contract_id: nextPrimeContractId,
          project_id: projectId,
          changed_by: session.id,
          changed_by_name: session.username,
          action: `Associated Change Order #${data.number}`,
          field_name: "change_order_association",
          from_value: "",
          to_value: String(data.id),
          details: `Change order ${data.number} (${data.title || "Untitled"}) was associated to this prime contract.`,
        });
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("change_orders")
    .select("id, status")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (existingError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (String(existing.status || "").trim().toLowerCase() === "approved") {
    return NextResponse.json({ error: "Approved change orders cannot be deleted." }, { status: 400 });
  }

  const { error } = await supabase
    .from("change_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", changeOrderId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
