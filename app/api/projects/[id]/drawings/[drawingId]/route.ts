import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; drawingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, drawingId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { drawing_no, title, revision, drawing_date, received_date } = body;

  const { data, error } = await supabase
    .from("project_drawings")
    .update({
      drawing_no: drawing_no ?? null,
      title: title ?? null,
      revision: revision ?? null,
      drawing_date: drawing_date || null,
      received_date: received_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logActivity(supabase, { projectId, userId: session.id, type: "drawing_updated", description: `Updated drawing: ${data.drawing_no || ""}${data.title ? ` - ${data.title}` : ""}`.trim() || "Updated drawing" });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; drawingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, drawingId } = await params;
  const supabase = getSupabase();

  // Get the drawing to find its upload_id
  const { data: drawing, error: fetchError } = await supabase
    .from("project_drawings")
    .select("upload_id, drawing_no, title")
    .eq("id", drawingId)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const uploadId = drawing.upload_id;

  // Delete the drawing page
  const { error: deleteError } = await supabase
    .from("project_drawings")
    .delete()
    .eq("id", drawingId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await logActivity(supabase, { projectId, userId: session.id, type: "drawing_deleted", description: `Deleted drawing: ${drawing.drawing_no || ""}${drawing.title ? ` - ${drawing.title}` : ""}`.trim() || "Deleted drawing" });

  // Check if this was the last page for the upload
  const { count } = await supabase
    .from("project_drawings")
    .select("id", { count: "exact", head: true })
    .eq("upload_id", uploadId);

  if (count === 0) {
    // Get storage path and delete upload + file
    const { data: upload } = await supabase
      .from("drawing_uploads")
      .select("storage_path")
      .eq("id", uploadId)
      .single();

    if (upload) {
      await supabase.storage.from("project-drawings").remove([upload.storage_path]);
    }

    await supabase.from("drawing_uploads").delete().eq("id", uploadId);
  }

  return NextResponse.json({ ok: true });
}
