import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string; timesheetId: string }> };

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

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, timesheetId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  if (body.action === "add_resources") {
    const resources = Array.isArray(body.resources) ? body.resources : [];
    if (!resources.length) return NextResponse.json({ error: "resources are required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("timesheet_entries")
      .select("resource_id, resource_name")
      .eq("timesheet_id", timesheetId);

    const existingKey = new Set((existing || []).map((x) => `${x.resource_id || ""}::${x.resource_name}`));

    const inserts = resources
      .filter((r: Record<string, unknown>) => String(r.name || "").trim())
      .map((r: Record<string, unknown>) => ({
        timesheet_id: timesheetId,
        project_id: projectId,
        resource_type: r.type === "equipment" ? "equipment" : "employee",
        resource_name: String(r.name),
        resource_id: r.id ? String(r.id) : null,
        total_hours: 0,
        time_type: "regular",
        billable: true,
        status: "draft",
      }))
      .filter((r) => !existingKey.has(`${r.resource_id || ""}::${r.resource_name}`));

    if (inserts.length) {
      const { error } = await supabase.from("timesheet_entries").insert(inserts);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = await supabase
      .from("timesheet_entries")
      .select("*, quantity:timesheet_entry_quantities(*)")
      .eq("timesheet_id", timesheetId)
      .order("resource_name", { ascending: true });

    return NextResponse.json(data || []);
  }

  if (body.action === "bulk_apply") {
    const ids = Array.isArray(body.entry_ids) ? body.entry_ids.map(String) : [];
    if (!ids.length) return NextResponse.json({ error: "entry_ids are required" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
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
    for (const field of fields) {
      if (field in body) updates[field] = body[field] || null;
    }

    if ("time_type" in updates && updates.time_type && !ALLOWED_TIME_TYPES.has(String(updates.time_type))) {
      return NextResponse.json({ error: "Invalid time_type" }, { status: 400 });
    }

    const { error } = await supabase
      .from("timesheet_entries")
      .update(updates)
      .eq("timesheet_id", timesheetId)
      .eq("project_id", projectId)
      .in("id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if ("units_installed" in body || "uom" in body || "quantity_notes" in body) {
      for (const id of ids) {
        const quantityPatch = {
          units_installed: body.units_installed ?? 0,
          uom: body.uom || null,
          notes: body.quantity_notes || null,
          updated_at: new Date().toISOString(),
        };

        const { data: existingQ } = await supabase
          .from("timesheet_entry_quantities")
          .select("id")
          .eq("timesheet_entry_id", id)
          .maybeSingle();

        if (existingQ?.id) {
          await supabase.from("timesheet_entry_quantities").update(quantityPatch).eq("timesheet_entry_id", id);
        } else {
          await supabase.from("timesheet_entry_quantities").insert({ timesheet_entry_id: id, ...quantityPatch });
        }
      }
    }

    const { data } = await supabase
      .from("timesheet_entries")
      .select("*, quantity:timesheet_entry_quantities(*)")
      .eq("timesheet_id", timesheetId)
      .order("resource_name", { ascending: true });

    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
