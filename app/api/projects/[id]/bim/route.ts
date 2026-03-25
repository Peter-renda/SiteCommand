import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bim_models")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ models: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const { filename, aps_object_key, urn } = body;

  if (!filename || !aps_object_key || !urn) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bim_models")
    .insert({
      project_id: projectId,
      filename,
      aps_object_key,
      urn,
      translation_status: "pending",
      uploaded_by: session.id,
      uploaded_by_name: session.username,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[bim/route] insert error:", error, "data:", data);
    return NextResponse.json(
      { error: error?.message ?? "Insert returned no data — check bim_models table schema and RLS" },
      { status: 500 }
    );
  }

  return NextResponse.json({ model: data }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const body = await req.json();
  const { modelId, translation_status } = body;

  if (!modelId || !translation_status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("bim_models")
    .update({ translation_status, updated_at: new Date().toISOString() })
    .eq("id", modelId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
