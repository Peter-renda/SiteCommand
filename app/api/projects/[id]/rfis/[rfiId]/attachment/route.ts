import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = getSupabase();

  const { data: rfi } = await supabase
    .from("rfis")
    .select("attachments")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();

  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${rfiId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("rfi-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("rfi-attachments").getPublicUrl(path);
  const attachment = { name: file.name, url: urlData.publicUrl };
  const attachments = Array.isArray(rfi.attachments) ? [...rfi.attachments, attachment] : [attachment];

  const { data: updated, error: updateError } = await supabase
    .from("rfis")
    .update({ attachments })
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(updated);
}
