import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, milestoneId } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) update.title = body.title;
  if (body.category !== undefined) update.category = body.category;
  if (body.status !== undefined) update.status = body.status;
  if (body.due_date !== undefined) update.due_date = body.due_date || null;
  if (body.assigned_to !== undefined) update.assigned_to = body.assigned_to || null;
  if (body.notes !== undefined) update.notes = body.notes || null;
  if (body.sort_order !== undefined) update.sort_order = body.sort_order;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("preconstruction_milestones")
    .update(update)
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, milestoneId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("preconstruction_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
