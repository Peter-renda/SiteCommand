import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { section_code, section_name, scope_text, sort_order } = body;

  if (scope_text !== undefined && !scope_text?.trim()) {
    return NextResponse.json({ error: "Scope text cannot be empty" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (section_code !== undefined) updates.section_code = section_code?.trim() || null;
  if (section_name !== undefined) updates.section_name = section_name?.trim() || null;
  if (scope_text !== undefined) updates.scope_text = scope_text.trim();
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("scope_items")
    .update(updates)
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
    .from("scope_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
