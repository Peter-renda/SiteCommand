import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logRFIChange } from "@/lib/rfi-history";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string; responseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId, responseId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = getSupabase();

  const { data: rfi } = await supabase
    .from("rfis")
    .select("id")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { data: response } = await supabase
    .from("rfi_responses")
    .select("id")
    .eq("id", responseId)
    .eq("rfi_id", rfiId)
    .single();
  if (!response) return NextResponse.json({ error: "Response not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${rfiId}/responses/${responseId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("rfi-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("rfi-attachments").getPublicUrl(path);
  const attachment = { name: file.name, url: urlData.publicUrl };

  // Fetch current attachments and append
  const { data: current } = await supabase
    .from("rfi_responses")
    .select("attachments")
    .eq("id", responseId)
    .single();
  const attachments = Array.isArray(current?.attachments) ? [...current.attachments, attachment] : [attachment];

  const { data: updated, error: updateError } = await supabase
    .from("rfi_responses")
    .update({ attachments })
    .eq("id", responseId)
    .eq("rfi_id", rfiId)
    .select("id, body, created_by, created_at, attachments")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  logRFIChange(supabase, session, rfiId, projectId, "Attachment added to Discussion Response", null, file.name);

  return NextResponse.json(updated);
}
