import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logSubmittalDiff } from "@/lib/submittal-history";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = getSupabase();

  const { data: submittal } = await supabase
    .from("submittals")
    .select("*")
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (!submittal) return NextResponse.json({ error: "Submittal not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${submittalId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("submittal-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("submittal-attachments").getPublicUrl(path);
  const attachment = { name: file.name, url: urlData.publicUrl };
  const attachments = Array.isArray(submittal.attachments)
    ? [...submittal.attachments, attachment]
    : [attachment];

  const { data: updated, error: updateError } = await supabase
    .from("submittals")
    .update({ attachments })
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logSubmittalDiff(
    supabase,
    session,
    submittalId,
    projectId,
    submittal as Record<string, unknown>,
    updated as Record<string, unknown>,
  );
  return NextResponse.json(updated);
}
