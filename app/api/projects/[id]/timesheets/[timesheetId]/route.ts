import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string; timesheetId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, timesheetId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  if (body.status) patch.status = body.status;
  if ("notes" in body) patch.notes = body.notes || null;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("timesheets")
    .update(patch)
    .eq("id", timesheetId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .select("*, entries:timesheet_entries(*, quantity:timesheet_entry_quantities(*))")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, timesheetId } = await params;
  const supabase = getSupabase();

  const { data: sheet } = await supabase
    .from("timesheets")
    .select("id,status")
    .eq("id", timesheetId)
    .eq("project_id", projectId)
    .single();

  if (!sheet) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  if (sheet.status === "approved") {
    return NextResponse.json({ error: "Approved timesheets must be moved to a different status before delete" }, { status: 400 });
  }

  const { error } = await supabase
    .from("timesheets")
    .update({ deleted_at: new Date().toISOString(), deleted_by: session.id, updated_at: new Date().toISOString() })
    .eq("id", timesheetId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
