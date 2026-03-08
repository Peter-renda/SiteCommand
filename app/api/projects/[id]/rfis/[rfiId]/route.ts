import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: "RFI not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const body = await req.json();

  const allowed = [
    "subject", "question", "due_date", "status",
    "rfi_manager_id", "received_from_id", "assignee_id", "assignees", "distribution_list",
    "responsible_contractor_id", "specification_id", "drawing_number", "attachments",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "subject") update[key] = (body[key] ?? "").toString().slice(0, 200);
      else update[key] = body[key] ?? null;
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rfis")
    .update(update)
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("rfis").delete().eq("id", rfiId).eq("project_id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
