import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("punch_list_items")
    .select("*")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const body = await req.json();

  const allowed = [
    "title", "status", "punch_item_manager_id", "type", "assignees",
    "due_date", "final_approver_id", "distribution_list", "location",
    "priority", "trade", "reference", "schedule_impact", "cost_impact",
    "cost_codes", "private", "description", "attachments",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("punch_list_items")
    .update(update)
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("punch_list_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
