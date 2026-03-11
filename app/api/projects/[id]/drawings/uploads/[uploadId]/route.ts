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

  // Get storage path before deleting
  const { data: upload, error: fetchError } = await supabase
    .from("drawing_uploads")
    .select("storage_path")
    .eq("id", uploadId)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // Delete upload row (cascade deletes drawing pages)
  const { error: deleteError } = await supabase
    .from("drawing_uploads")
    .delete()
    .eq("id", uploadId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // Delete storage file
  if (upload?.storage_path) {
    await supabase.storage.from("project-drawings").remove([upload.storage_path]);
  }

  return NextResponse.json({ ok: true });
}
