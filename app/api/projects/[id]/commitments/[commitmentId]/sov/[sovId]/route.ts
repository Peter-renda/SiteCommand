import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canEditSov } from "@/lib/commitment-gates";
import { requireToolLevel } from "@/lib/tool-permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string; sovId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId, sovId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const gate = await canEditSov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const body = await req.json();

  const allowed = [
    "is_group_header",
    "group_name",
    "change_event_line_item",
    "budget_code",
    "description",
    "qty",
    "uom",
    "unit_cost",
    "amount",
    "billed_to_date",
    "sort_order",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("commitment_sov_items")
    .update(updates)
    .eq("id", sovId)
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string; sovId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId, sovId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const gate = await canEditSov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const { error } = await supabase
    .from("commitment_sov_items")
    .delete()
    .eq("id", sovId)
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
