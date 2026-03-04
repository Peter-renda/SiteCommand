import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase.from("rfis").select("id").eq("id", rfiId).eq("project_id", projectId).single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("rfi_responses")
    .select("id, body, created_by, created_at, attachments, users(username, company)")
    .eq("rfi_id", rfiId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    body: r.body,
    created_by: r.created_by,
    created_at: r.created_at,
    attachments: r.attachments ?? [],
    author_name: r.users?.username ?? null,
    author_company: r.users?.company ?? null,
  }));

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase.from("rfis").select("id, rfi_number").eq("id", rfiId).eq("project_id", projectId).single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  let body = "";
  let attachments: { name: string; url: string }[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = ((formData.get("body") as string) ?? "").trim();
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${projectId}/${rfiId}/responses/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("rfi-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
      const { data: urlData } = supabase.storage.from("rfi-attachments").getPublicUrl(path);
      attachments = [{ name: file.name, url: urlData.publicUrl }];
    }
  } else {
    const json = await req.json();
    body = (json.body ?? "").trim();
  }

  if (!body) return NextResponse.json({ error: "Body is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("rfi_responses")
    .insert({ rfi_id: rfiId, body, created_by: session.id, attachments })
    .select("id, body, created_by, created_at, attachments")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logActivity(supabase, { projectId, userId: session.id, type: "rfi_response_added", description: `Added response to RFI #${rfi.rfi_number}` });

  const { data: userRow } = await supabase.from("users").select("username, company").eq("id", session.id).single();

  return NextResponse.json({
    ...data,
    author_name: userRow?.username ?? session.username,
    author_company: userRow?.company ?? null,
  });
}
