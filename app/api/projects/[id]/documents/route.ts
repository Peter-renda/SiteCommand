import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const sp = new URL(req.url).searchParams;
  const parentId = sp.get("parent_id");
  const allFolders = sp.get("all_folders") === "true";
  const supabase = getSupabase();

  if (allFolders) {
    const { data } = await supabase
      .from("documents")
      .select("id, name, parent_id")
      .eq("project_id", projectId)
      .eq("type", "folder")
      .order("name");
    return NextResponse.json(data || []);
  }

  let query = supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("type", { ascending: false })
    .order("name", { ascending: true });

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data } = await query;
  const items = (data || []).map((doc) => ({
    ...doc,
    url: doc.storage_path
      ? supabase.storage.from("project-documents").getPublicUrl(doc.storage_path).data.publicUrl
      : null,
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rawParentId = formData.get("parent_id") as string | null;
    const parentId = rawParentId && rawParentId !== "null" ? rawParentId : null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const docId = crypto.randomUUID();
    const path = `${projectId}/${docId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data } = await supabase
      .from("documents")
      .insert({
        id: docId,
        project_id: projectId,
        parent_id: parentId || null,
        name: file.name,
        type: "file",
        storage_path: path,
        mime_type: file.type,
        size: file.size,
        created_by: session.id,
      })
      .select()
      .single();

    return NextResponse.json({
      ...data,
      url: supabase.storage.from("project-documents").getPublicUrl(path).data.publicUrl,
    });
  } else {
    const { name, parent_id } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const { data } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        parent_id: parent_id || null,
        name,
        type: "folder",
        created_by: session.id,
      })
      .select()
      .single();

    return NextResponse.json({ ...data, url: null });
  }
}
