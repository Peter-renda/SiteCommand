import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canEditSsov } from "@/lib/commitment-gates";
import { requireSsovWriter } from "@/lib/tool-permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string; ssovId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId, ssovId } = await params;
  const denied = await requireSsovWriter(session, projectId, commitmentId);
  if (denied) return denied;

  const supabase = getSupabase();

  const gate = await canEditSsov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const body = await req.json();
  const allowed = ["sov_item_id", "budget_code", "description", "amount", "sort_order"];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("commitment_ssov_items")
    .update(updates)
    .eq("id", ssovId)
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string; ssovId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId, ssovId } = await params;
  const denied = await requireSsovWriter(session, projectId, commitmentId);
  if (denied) return denied;

  const supabase = getSupabase();

  const gate = await canEditSsov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const { error } = await supabase
    .from("commitment_ssov_items")
    .delete()
    .eq("id", ssovId)
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
