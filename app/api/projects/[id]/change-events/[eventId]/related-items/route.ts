import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("change_event_related_items")
    .select("*")
    .eq("change_event_id", eventId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // Table may not exist yet — return empty array gracefully
    return NextResponse.json([]);
  }
  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("change_event_related_items")
    .select("sort_order")
    .eq("change_event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("change_event_related_items")
    .insert({
      change_event_id: eventId,
      project_id: projectId,
      item_type: typeof body.item_type === "string" ? body.item_type : "",
      item_id: typeof body.item_id === "string" ? body.item_id : null,
      item_label: typeof body.item_label === "string" ? body.item_label : null,
      item_date: typeof body.item_date === "string" ? body.item_date : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      sort_order: nextSort,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
