import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("submittals")
    .select("*")
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Submittal not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const body = await req.json();

  const allowed = [
    "title", "revision", "specification_id", "submittal_type", "status",
    "responsible_contractor_id", "received_from_id", "submittal_manager_id",
    "submit_by", "received_date", "issue_date", "final_due_date",
    "cost_code", "linked_drawings", "distribution_list", "ball_in_court_id",
    "lead_time", "required_on_site_date", "private", "description", "attachments",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("submittals")
    .update(update)
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logActivity(supabase, { projectId, userId: session.id, type: "submittal_updated", description: `Updated submittal #${data.submittal_number}: ${data.title}` });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const supabase = getSupabase();
  const { data: submittal } = await supabase.from("submittals").select("submittal_number, title").eq("id", submittalId).eq("project_id", projectId).single();

  const { error } = await supabase
    .from("submittals")
    .delete()
    .eq("id", submittalId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logActivity(supabase, { projectId, userId: session.id, type: "submittal_deleted", description: `Deleted submittal #${submittal?.submittal_number}: ${submittal?.title ?? ""}` });
  return NextResponse.json({ ok: true });
}
