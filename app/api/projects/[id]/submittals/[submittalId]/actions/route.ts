import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

function nextRevisionValue(current: string | null): string {
  const value = (current ?? "0").trim();
  if (/^\d+$/.test(value)) return String(Number(value) + 1);
  if (/^[A-Z]$/.test(value)) return String.fromCharCode(value.charCodeAt(0) + 1);
  if (/^[A-Z]\d+$/.test(value)) {
    const prefix = value[0];
    const num = Number(value.slice(1));
    return `${prefix}${num + 1}`;
  }
  return `${value}-rev`;
}

async function getNextSubmittalNumber(projectId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("submittals")
    .select("submittal_number")
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .order("submittal_number", { ascending: false })
    .limit(1)
    .single();
  return (data?.submittal_number ?? 0) + 1;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const { action, payload } = await req.json();
  const supabase = getSupabase();

  const { data: existing, error: getError } = await supabase
    .from("submittals")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", submittalId)
    .eq("is_deleted", false)
    .single();

  if (getError || !existing) {
    return NextResponse.json({ error: "Submittal not found" }, { status: 404 });
  }

  if (action === "change_ball_in_court") {
    if (!["draft", "open"].includes(existing.status)) {
      return NextResponse.json({ error: "Ball in Court can only be changed on Draft/Open submittals" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("submittals")
      .update({ ball_in_court_id: payload?.ball_in_court_id ?? null })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "close") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: session.id })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "distribute") {
    const closePayload = {
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: session.id,
      distributed_at: new Date().toISOString(),
      distributed_by: session.id,
    };
    const { data: closed, error } = await supabase
      .from("submittals")
      .update(closePayload)
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error || !closed) return NextResponse.json({ error: error?.message ?? "Failed to distribute" }, { status: 500 });

    if (payload?.create_revision_upon_distribution) {
      const nextNumber = await getNextSubmittalNumber(projectId);
      const nextRevision = nextRevisionValue(closed.revision);
      const { data: revision, error: revError } = await supabase
        .from("submittals")
        .insert({
          ...closed,
          id: undefined,
          submittal_number: nextNumber,
          revision: nextRevision,
          status: "draft",
          closed_at: null,
          closed_by: null,
          distributed_at: null,
          distributed_by: null,
          duplicate_of_id: closed.id,
          created_by: session.id,
          created_at: undefined,
        })
        .select()
        .single();
      if (revError) return NextResponse.json({ error: revError.message }, { status: 500 });
      return NextResponse.json({ distributed: closed, revision });
    }

    return NextResponse.json({ distributed: closed });
  }

  if (action === "duplicate" || action === "create_revision") {
    const nextNumber = await getNextSubmittalNumber(projectId);
    const revision = action === "create_revision" ? nextRevisionValue(existing.revision) : existing.revision;

    const { data, error } = await supabase
      .from("submittals")
      .insert({
        ...existing,
        id: undefined,
        submittal_number: nextNumber,
        revision,
        status: "draft",
        closed_at: null,
        closed_by: null,
        distributed_at: null,
        distributed_by: null,
        duplicate_of_id: existing.id,
        created_by: session.id,
        created_at: undefined,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
