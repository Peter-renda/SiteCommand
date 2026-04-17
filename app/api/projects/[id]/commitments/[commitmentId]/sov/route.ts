import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canEditSov } from "@/lib/commitment-gates";
import { requireToolLevel } from "@/lib/tool-permissions";
import { canViewCommitmentSov } from "@/lib/commitment-visibility";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "read_only");
  if (denied) return denied;

  const canView = await canViewCommitmentSov(session, projectId, commitmentId);
  if (!canView) return NextResponse.json([]);

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("commitment_sov_items")
    .select("*")
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const gate = await canEditSov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const body = await req.json();

  const {
    is_group_header,
    group_name,
    change_event_line_item,
    budget_code,
    description,
    qty,
    uom,
    unit_cost,
    amount,
    billed_to_date,
    sort_order,
  } = body;

  const { data, error } = await supabase
    .from("commitment_sov_items")
    .insert({
      commitment_id: commitmentId,
      project_id: projectId,
      is_group_header: is_group_header ?? false,
      group_name: group_name || "",
      change_event_line_item: change_event_line_item || "",
      budget_code: budget_code || "",
      description: description || "",
      qty: qty ?? 0,
      uom: uom || "",
      unit_cost: unit_cost ?? 0,
      amount: amount ?? 0,
      billed_to_date: billed_to_date ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
