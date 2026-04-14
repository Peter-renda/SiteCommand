import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId, itemId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if ("item_type" in body) update.item_type = typeof body.item_type === "string" ? body.item_type : "";
  if ("item_id" in body) update.item_id = typeof body.item_id === "string" ? body.item_id : null;
  if ("item_label" in body) update.item_label = typeof body.item_label === "string" ? body.item_label : null;
  if ("item_date" in body) update.item_date = typeof body.item_date === "string" && body.item_date ? body.item_date : null;
  if ("notes" in body) update.notes = typeof body.notes === "string" ? body.notes : null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("change_event_related_items")
    .update(update)
    .eq("id", itemId)
    .eq("change_event_id", eventId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId, itemId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("change_event_related_items")
    .delete()
    .eq("id", itemId)
    .eq("change_event_id", eventId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
