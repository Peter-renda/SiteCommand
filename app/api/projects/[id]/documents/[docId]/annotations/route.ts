import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET: fetch all annotations for a document
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("document_annotations")
    .select("id, created_by, created_by_name, role, annotation_data, updated_at")
    .eq("document_id", docId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: save (insert or overwrite) annotation record for the current user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const body = await req.json();
  const { annotation_data } = body;

  if (!Array.isArray(annotation_data)) {
    return NextResponse.json({ error: "annotation_data must be an array" }, { status: 400 });
  }

  const supabase = getSupabase();
  const role = session.company_role || session.role || "member";
  const now = new Date().toISOString();
  const username = session.username || "Unknown";

  // 1. Look for an existing record owned by this user's UUID
  const { data: existing, error: selectError } = await supabase
    .from("document_annotations")
    .select("id")
    .eq("document_id", docId)
    .eq("created_by", session.id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existing) {
    // Update the existing record
    const { data, error } = await supabase
      .from("document_annotations")
      .update({ annotation_data, role, updated_at: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // 2. No record by UUID — check for a legacy record with created_by = NULL and matching name
  //    (these were created before the UUID column was populated)
  const { data: legacy, error: legacyError } = await supabase
    .from("document_annotations")
    .select("id")
    .eq("document_id", docId)
    .eq("created_by_name", username)
    .is("created_by", null)
    .maybeSingle();

  if (!legacyError && legacy) {
    // Claim the legacy record by writing the UUID into it
    const { data, error } = await supabase
      .from("document_annotations")
      .update({ annotation_data, role, created_by: session.id, updated_at: now })
      .eq("id", legacy.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // 3. Insert a brand-new record
  const { data, error } = await supabase
    .from("document_annotations")
    .insert({
      document_id: docId,
      project_id: projectId,
      created_by: session.id,
      created_by_name: username,
      role,
      annotation_data,
      updated_at: now,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
