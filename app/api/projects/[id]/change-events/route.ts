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
  const includeDeleted = searchParams.get("recycle_bin") === "true";

  const query = supabase
    .from("change_events")
    .select(`
      *,
      line_items:change_event_line_items(*)
    `)
    .eq("project_id", projectId)
    .order("number", { ascending: false });

  if (includeDeleted) {
    query.not("deleted_at", "is", null);
  } else {
    query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) {
    // Table may not exist yet — return empty array gracefully
    return NextResponse.json([]);
  }
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

  // Get next number
  const { data: existing } = await supabase
    .from("change_events")
    .select("number")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;

  const { data, error } = await supabase
    .from("change_events")
    .insert({
      project_id: projectId,
      number: nextNumber,
      title: body.title || "",
      status: body.status || "Open",
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
