import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string; timesheetId: string; entryId: string }> };

const ALLOWED_TIME_TYPES = new Set([
  "regular",
  "double_time",
  "exempt",
  "holiday",
  "overtime",
  "pto",
  "salary",
  "vacation",
]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, timesheetId, entryId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data: existing } = await supabase
    .from("timesheet_entries")
    .select("id,status")
    .eq("id", entryId)
    .eq("timesheet_id", timesheetId)
    .eq("project_id", projectId)
    .single();

  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  if (existing.status === "completed") {
    return NextResponse.json({ error: "Completed timecard entries cannot be edited" }, { status: 400 });
  }

  const fields = [
    "start_time",
    "stop_time",
    "lunch_minutes",
    "total_hours",
    "time_type",
    "billable",
    "enforce_time_type_rules",
    "cost_code",
    "cost_type",
    "location_id",
    "location_path",
    "description",
    "status",
  ];

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of fields) {
    if (field in body) patch[field] = body[field] || null;
  }

  if ("time_type" in patch && patch.time_type && !ALLOWED_TIME_TYPES.has(String(patch.time_type))) {
    return NextResponse.json({ error: "Invalid time_type" }, { status: 400 });
  }

  const { error } = await supabase
    .from("timesheet_entries")
    .update(patch)
    .eq("id", entryId)
    .eq("timesheet_id", timesheetId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ("quantity" in body) {
    if (body.quantity === null) {
      await supabase.from("timesheet_entry_quantities").delete().eq("timesheet_entry_id", entryId);
    } else {
      const quantityPatch = {
        units_installed: body.quantity.units_installed ?? 0,
        uom: body.quantity.uom || null,
        notes: body.quantity.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data: existingQ } = await supabase
        .from("timesheet_entry_quantities")
        .select("id")
        .eq("timesheet_entry_id", entryId)
        .maybeSingle();

      if (existingQ?.id) {
        await supabase.from("timesheet_entry_quantities").update(quantityPatch).eq("timesheet_entry_id", entryId);
      } else {
        await supabase.from("timesheet_entry_quantities").insert({ timesheet_entry_id: entryId, ...quantityPatch });
      }
    }
  }

  const { data } = await supabase
    .from("timesheet_entries")
    .select("*, quantity:timesheet_entry_quantities(*)")
    .eq("id", entryId)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, timesheetId, entryId } = await params;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("timesheet_entries")
    .select("id,status")
    .eq("id", entryId)
    .eq("timesheet_id", timesheetId)
    .eq("project_id", projectId)
    .single();

  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  if (existing.status === "approved") {
    return NextResponse.json({ error: "Approved timecard entries cannot be deleted" }, { status: 400 });
  }

  const { error } = await supabase
    .from("timesheet_entries")
    .delete()
    .eq("id", entryId)
    .eq("timesheet_id", timesheetId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
