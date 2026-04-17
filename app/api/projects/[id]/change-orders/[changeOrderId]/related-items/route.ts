import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "read_only");
  if (denied) return denied;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_order_related_items")
    .select("*")
    .eq("change_order_id", changeOrderId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("change_order_related_items")
    .insert({
      change_order_id: changeOrderId,
      project_id: projectId,
      item_type: body.item_type ?? "",
      item_id: body.item_id ?? null,
      item_label: body.item_label ?? null,
      item_date: body.item_date ?? null,
      notes: body.notes ?? null,
      sort_order: body.sort_order ?? 0,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
