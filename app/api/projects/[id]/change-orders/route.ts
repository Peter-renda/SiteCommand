import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type ScheduleOfValueLine = {
  budget_code?: string | null;
  description?: string | null;
  amount?: number | string | null;
};

function isMissingScheduleOfValuesColumn(message?: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("schedule_of_values") && text.includes("change_orders");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "prime"; // "prime" | "commitment"

  const query = supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", projectId)
    .eq("type", type)
    .is("deleted_at", null)
    .order("number", { ascending: false });

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
  const normalizedSov = Array.isArray(body.schedule_of_values)
    ? body.schedule_of_values
        .map((line: ScheduleOfValueLine) => ({
          budget_code: String(line?.budget_code || "").trim(),
          description: String(line?.description || "").trim(),
          amount: Number(line?.amount || 0),
        }))
        .filter((line) => line.budget_code || line.description || line.amount)
    : [];

  // Get next number for this project + type
  const { data: existing } = await supabase
    .from("change_orders")
    .select("number")
    .eq("project_id", projectId)
    .eq("type", body.type || "prime")
    .is("deleted_at", null);

  const maxExistingNumber = Array.isArray(existing)
    ? existing.reduce((max, row) => {
        const parsed = Number.parseInt(String(row?.number ?? ""), 10);
        return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
      }, 0)
    : 0;

  const requestedNumber = String(body?.number ?? "").trim();
  const parsedRequestedNumber = Number.parseInt(requestedNumber, 10);
  const nextNumber =
    requestedNumber && Number.isFinite(parsedRequestedNumber)
      ? parsedRequestedNumber
      : maxExistingNumber + 1;

  const insertPayload = {
    project_id: projectId,
    prime_contract_id: body.prime_contract_id || null,
    commitment_id: body.commitment_id || null,
    type: body.type || "prime",
    contract_name: body.contract_name || "",
    number: String(nextNumber).padStart(3, "0"),
    revision: body.revision ?? 0,
    title: body.title || "",
    date_initiated: body.date_initiated || new Date().toISOString().slice(0, 10),
    contract_company: body.contract_company || "",
    designated_reviewer: body.designated_reviewer || null,
    due_date: body.due_date || null,
    review_date: body.review_date || null,
    status: body.status || "Draft",
    amount: body.amount ?? 0,
    is_locked: body.is_locked ?? false,
    has_attachments: body.has_attachments ?? false,
    // Extended fields
    change_reason: body.change_reason || "",
    description: body.description || "",
    is_private: body.is_private ?? true,
    executed: body.executed ?? false,
    request_received_from: body.request_received_from || "",
    schedule_impact: body.schedule_impact ?? null,
    reference: body.reference || "",
    signed_change_order_received_date: body.signed_change_order_received_date || null,
    location: body.location || "",
    field_change: body.field_change ?? false,
    paid_in_full: body.paid_in_full ?? false,
    prime_contract_change_order: body.prime_contract_change_order || "none",
    source_change_event_ids: Array.isArray(body.source_change_event_ids) ? body.source_change_event_ids : [],
    budget_codes: Array.isArray(body.budget_codes) ? body.budget_codes : [],
    schedule_of_values: normalizedSov,
    invoiced_date: body.invoiced_date || null,
    paid_date: body.paid_date || null,
    reviewer: body.reviewer || "",
  };

  let { data, error } = await supabase
    .from("change_orders")
    .insert(insertPayload)
    .select()
    .single();

  if (isMissingScheduleOfValuesColumn(error?.message)) {
    const fallback = await supabase
      .from("change_orders")
      .insert({
        ...insertPayload,
        // Legacy DB fallback: column may not exist in some environments.
        schedule_of_values: undefined,
      })
      .select()
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
