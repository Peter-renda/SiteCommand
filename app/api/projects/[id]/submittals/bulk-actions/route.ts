import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { action, submittal_ids: submittalIds, payload } = await req.json();

  if (!Array.isArray(submittalIds) || submittalIds.length === 0) {
    return NextResponse.json({ error: "submittal_ids is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (action === "mark_private" || action === "mark_public") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ private: action === "mark_private" })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "delete") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: session.id })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "change_status") {
    const nextStatus = payload?.status as string | undefined;
    if (!nextStatus) return NextResponse.json({ error: "payload.status is required" }, { status: 400 });
    const { data, error } = await supabase
      .from("submittals")
      .update({ status: nextStatus })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "redistribute") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ distributed_at: new Date().toISOString(), distributed_by: session.id })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
