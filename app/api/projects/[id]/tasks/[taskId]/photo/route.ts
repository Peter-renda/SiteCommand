import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const formData = await req.formData();
  const file = formData.get("photo") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `${projectId}/${taskId}.${ext}`;
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from("task-photos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("task-photos").getPublicUrl(path);
  const photoUrl = urlData.publicUrl;

  await supabase.from("tasks").update({ photo_url: photoUrl }).eq("id", taskId).eq("project_id", projectId);

  return NextResponse.json({ photo_url: photoUrl });
}
