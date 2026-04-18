import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");

  let query = supabase
    .from("timesheets")
    .select("*, entries:timesheet_entries(*, quantity:timesheet_entry_quantities(*))")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("work_date", { ascending: false });

  if (from) query = query.gte("work_date", from);
  if (to) query = query.lte("work_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const body = await req.json();
  const workDate = String(body.work_date || "").trim();
  const copyFromTimesheetId = body.copy_from_timesheet_id ? String(body.copy_from_timesheet_id) : null;

  if (!workDate) return NextResponse.json({ error: "work_date is required" }, { status: 400 });

  const { data: created, error: createErr } = await supabase
    .from("timesheets")
    .insert({
      project_id: projectId,
      work_date: workDate,
      status: "draft",
      created_by: session.id,
    })
    .select("*")
    .single();

  if (createErr) {
    const alreadyExists = createErr.code === "23505";
    if (alreadyExists) return NextResponse.json({ error: "A timesheet already exists for this date" }, { status: 409 });
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  if (copyFromTimesheetId) {
    const { data: priorEntries } = await supabase
      .from("timesheet_entries")
      .select("resource_type,resource_name,resource_id,time_type,billable,cost_code,cost_type,location_id,location_path")
      .eq("timesheet_id", copyFromTimesheetId);

    if (priorEntries?.length) {
      await supabase.from("timesheet_entries").insert(
        priorEntries.map((entry) => ({
          ...entry,
          timesheet_id: created.id,
          project_id: projectId,
          total_hours: 0,
          lunch_minutes: 0,
          status: "draft",
        })),
      );
    }
  }

  const { data: hydrated } = await supabase
    .from("timesheets")
    .select("*, entries:timesheet_entries(*, quantity:timesheet_entry_quantities(*))")
    .eq("id", created.id)
    .single();

  return NextResponse.json(hydrated || created);
}
