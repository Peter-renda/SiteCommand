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
  const type = searchParams.get("type") || "prime"; // "prime" | "commitment"

  let query = supabase
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

  // Get next number for this project + type
  const { data: existing } = await supabase
    .from("change_orders")
    .select("number")
    .eq("project_id", projectId)
    .eq("type", body.type || "prime")
    .order("number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;

  const { data, error } = await supabase
    .from("change_orders")
    .insert({
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
