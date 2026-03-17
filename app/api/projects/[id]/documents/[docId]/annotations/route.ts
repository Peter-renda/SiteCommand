import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET: fetch all annotations for a document
export async function GET(
  req: NextRequest,
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

// POST: upsert annotation record for the current user
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

  // Determine role from session
  const role = (session as { company_role?: string; role?: string }).company_role
    || (session as { role?: string }).role
    || "member";

  const { data, error } = await supabase
    .from("document_annotations")
    .upsert(
      {
        document_id: docId,
        project_id: projectId,
        created_by: session.id,
        created_by_name: session.username || "Unknown",
        role,
        annotation_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "document_id,created_by" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
