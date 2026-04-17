import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const actorEmail = searchParams.get("actor_email");
  const eventType = searchParams.get("event_type");

  if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

  // Daily log subtypes — fetch logs then flatten JSONB array
  const dailyLogTypes = [
    "daily-delays",
    "daily-manpower",
    "daily-weather",
    "daily-safety",
    "daily-accidents",
    "daily-inspections",
    "daily-deliveries",
    "daily-visitors",
    "daily-notes",
  ];

  if (dailyLogTypes.includes(type)) {
    let query = supabase
      .from("daily_logs")
      .select("log_date, delays, manpower, weather_observations, safety_violations, accidents, inspections, deliveries, visitors, note_entries")
      .eq("project_id", projectId)
      .order("log_date", { ascending: false });

    if (startDate) query = query.gte("log_date", startDate);
    if (endDate) query = query.lte("log_date", endDate);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const fieldMap: Record<string, string> = {
      "daily-delays": "delays",
      "daily-manpower": "manpower",
      "daily-weather": "weather_observations",
      "daily-safety": "safety_violations",
      "daily-accidents": "accidents",
      "daily-inspections": "inspections",
      "daily-deliveries": "deliveries",
      "daily-visitors": "visitors",
      "daily-notes": "note_entries",
    };

    const field = fieldMap[type];
    const rows: Record<string, unknown>[] = [];
    for (const log of data ?? []) {
      const entries = (log[field as keyof typeof log] as Record<string, unknown>[] | null) ?? [];
      for (const entry of entries) {
        rows.push({ log_date: log.log_date, ...entry });
      }
    }

    return NextResponse.json(rows);
  }

  // Table-based report types
  if (type === "rfis") {
    const { data, error } = await supabase
      .from("rfis")
      .select("rfi_number, subject, status, due_date, created_at")
      .eq("project_id", projectId)
      .order("rfi_number", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (type === "submittals") {
    const { data, error } = await supabase
      .from("submittals")
      .select("submittal_number, title, status, submittal_type, submit_by, received_date, issue_date, cost_code")
      .eq("project_id", projectId)
      .order("submittal_number", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (type === "tasks") {
    const { data, error } = await supabase
      .from("tasks")
      .select("task_number, title, status, category, created_at")
      .eq("project_id", projectId)
      .order("task_number", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (type === "punch-list") {
    const { data, error } = await supabase
      .from("punch_list_items")
      .select("item_number, title, status, type, trade, priority, due_date, location")
      .eq("project_id", projectId)
      .order("item_number", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (type === "user-activity") {
    let query = supabase
      .from("activity_log")
      .select("id, type, description, created_at, project_id, user:users(email)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    if (endDate) query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    if (eventType) query = query.ilike("type", `%${eventType}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? [])
      .map((row) => {
        const eventTypeValue = row.type ?? "";
        const toolName = eventTypeValue.includes(".") ? eventTypeValue.split(".")[0] : eventTypeValue;
        const actorEmailValue =
          row.user && typeof row.user === "object" && "email" in row.user ? (row.user.email as string | null) : null;
        return {
          created_at: row.created_at,
          actor_email: actorEmailValue ?? "System",
          event_type: eventTypeValue,
          tool_name: toolName,
          description: row.description,
          project_name: "Current Project",
          object_id: row.id,
        };
      })
      .filter((row) => (actorEmail ? row.actor_email.toLowerCase().includes(actorEmail.toLowerCase()) : true));

    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
