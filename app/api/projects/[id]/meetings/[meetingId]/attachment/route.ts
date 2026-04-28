import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type MeetingAttachment = { name: string; url: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, meetingId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = getSupabase();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("attachments")
    .eq("id", meetingId)
    .eq("project_id", projectId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${meetingId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("meeting-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("meeting-attachments").getPublicUrl(path);
  const attachment: MeetingAttachment = { name: file.name, url: urlData.publicUrl };
  const existingAttachments = Array.isArray(meeting.attachments)
    ? (meeting.attachments as MeetingAttachment[])
    : [];

  const { data: updated, error: updateError } = await supabase
    .from("meetings")
    .update({ attachments: [...existingAttachments, attachment] })
    .eq("id", meetingId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(updated);
}
