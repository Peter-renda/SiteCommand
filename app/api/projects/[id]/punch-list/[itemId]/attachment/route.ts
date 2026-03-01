import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = getSupabase();

  const { data: item } = await supabase
    .from("punch_list_items")
    .select("attachments")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${itemId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("punch-list-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("punch-list-attachments").getPublicUrl(path);
  const attachment = { name: file.name, url: urlData.publicUrl };
  const attachments = Array.isArray(item.attachments)
    ? [...item.attachments, attachment]
    : [attachment];

  const { data: updated, error: updateError } = await supabase
    .from("punch_list_items")
    .update({ attachments })
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(updated);
}
