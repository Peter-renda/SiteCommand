import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { SupabaseClient } from "@supabase/supabase-js";

async function deepCopy(supabase: SupabaseClient, docId: string, newParentId: string | null, projectId: string): Promise<void> {
  const { data: doc } = await supabase.from("documents").select("*").eq("id", docId).single();
  if (!doc) return;

  const newId = crypto.randomUUID();

  if (doc.type === "file" && doc.storage_path) {
    const newPath = `${projectId}/${newId}/${doc.name}`;
    const { data: fileData } = await supabase.storage.from("project-documents").download(doc.storage_path);
    if (fileData) {
      await supabase.storage.from("project-documents").upload(newPath, fileData, { contentType: doc.mime_type || undefined });
    }
    await supabase.from("documents").insert({
      id: newId,
      project_id: projectId,
      parent_id: newParentId,
      name: `${doc.name} (copy)`,
      type: "file",
      storage_path: newPath,
      mime_type: doc.mime_type,
      size: doc.size,
    });
  } else {
    await supabase.from("documents").insert({
      id: newId,
      project_id: projectId,
      parent_id: newParentId,
      name: `${doc.name} (copy)`,
      type: "folder",
    });
    const { data: children } = await supabase.from("documents").select("id").eq("parent_id", docId);
    for (const child of children || []) {
      await deepCopy(supabase, child.id, newId, projectId);
    }
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();

  const { data: doc } = await supabase.from("documents").select("parent_id").eq("id", docId).single();
  await deepCopy(supabase, docId, doc?.parent_id ?? null, projectId);

  return NextResponse.json({ ok: true });
}
