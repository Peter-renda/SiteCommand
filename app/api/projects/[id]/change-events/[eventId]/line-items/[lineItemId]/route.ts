import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";
import { logChangeEventHistory } from "@/lib/change-event-history";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string; lineItemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, lineItemId, eventId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getSupabase();
  const body = await req.json();
  const { data: existingLineItem } = await supabase
    .from("change_event_line_items")
    .select("*")
    .eq("id", lineItemId)
    .eq("change_event_id", eventId)
    .single();

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

  const trackedFields: Array<{ key: string; label: string }> = [
    { key: "budget_code", label: "Budget Code" },
    { key: "description", label: "Description" },
    { key: "vendor", label: "Vendor" },
    { key: "contract_number", label: "Contract" },
    { key: "unit_of_measure", label: "UOM" },
    { key: "rev_unit_qty", label: "Revenue Unit Qty" },
    { key: "rev_unit_cost", label: "Revenue Unit Cost" },
    { key: "rev_rom", label: "Revenue ROM" },
    { key: "cost_unit_qty", label: "Cost Unit Qty" },
    { key: "cost_unit_cost", label: "Cost Unit Cost" },
    { key: "cost_rom", label: "Cost ROM" },
  ];

  if (existingLineItem) {
    for (const field of trackedFields) {
      if (!(field.key in body)) continue;
      const oldValueRaw = existingLineItem[field.key];
      const newValueRaw = body[field.key];
      const oldValue =
        oldValueRaw === null || oldValueRaw === undefined || oldValueRaw === ""
          ? "(None)"
          : String(oldValueRaw);
      const newValue =
        newValueRaw === null || newValueRaw === undefined || newValueRaw === ""
          ? "(None)"
          : String(newValueRaw);

      if (oldValue !== newValue) {
        await logChangeEventHistory(
          supabase,
          session,
          eventId,
          projectId,
          `Change event/line item ${field.label}`,
          oldValue,
          newValue
        );
      }
    }
  }

  return NextResponse.json(data);
}
