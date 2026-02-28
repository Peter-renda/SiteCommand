import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const body = await req.json();

  const allowed = ["title", "status", "category", "description", "distribution_list", "photo_url", "due_date"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const supabase = getSupabase();

  // Remove photo from storage if exists
  const { data: task } = await supabase.from("tasks").select("photo_url").eq("id", taskId).single();
  if (task?.photo_url) {
    const path = task.photo_url.split("/task-photos/")[1]?.split("?")[0];
    if (path) await supabase.storage.from("task-photos").remove([decodeURIComponent(path)]);
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("project_id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
