import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string; lineItemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lineItemId, eventId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if ("budget_code" in body) updates.budget_code = body.budget_code ?? null;
  if ("description" in body) updates.description = body.description ?? null;
  if ("vendor" in body) updates.vendor = body.vendor ?? null;
  if ("contract_number" in body) updates.contract_number = body.contract_number ?? null;
  if ("unit_of_measure" in body) updates.unit_of_measure = body.unit_of_measure ?? null;
  if ("rev_unit_qty" in body) updates.rev_unit_qty = body.rev_unit_qty ?? null;
  if ("rev_unit_cost" in body) updates.rev_unit_cost = body.rev_unit_cost ?? null;
  if ("rev_rom" in body) updates.rev_rom = body.rev_rom ?? null;
  if ("cost_unit_qty" in body) updates.cost_unit_qty = body.cost_unit_qty ?? null;
  if ("cost_unit_cost" in body) updates.cost_unit_cost = body.cost_unit_cost ?? null;
  if ("cost_rom" in body) updates.cost_rom = body.cost_rom ?? null;

  const { data, error } = await supabase
    .from("change_event_line_items")
    .update(updates)
    .eq("id", lineItemId)
    .eq("change_event_id", eventId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
