import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadId } = await params;
  const supabase = getSupabase();

  // Collect all per-page storage paths before deleting rows
  const { data: pages } = await supabase
    .from("project_drawings")
    .select("storage_path")
    .eq("upload_id", uploadId);

  const { data: upload } = await supabase
    .from("drawing_uploads")
    .select("storage_path")
    .eq("id", uploadId)
    .single();

  // Delete upload row (cascade deletes drawing rows)
  const { error: deleteError } = await supabase
    .from("drawing_uploads")
    .delete()
    .eq("id", uploadId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // Remove all per-page PDFs from storage
  const pathsToRemove: string[] = [];
  for (const page of pages ?? []) {
    if (page.storage_path) pathsToRemove.push(page.storage_path);
  }
  // Also remove the upload's own storage path (original PDF reference)
  if (upload?.storage_path) pathsToRemove.push(upload.storage_path);

  if (pathsToRemove.length > 0) {
    await supabase.storage.from("project-drawings").remove(pathsToRemove);
  }

  return NextResponse.json({ ok: true });
}
