import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";

type FileEntry = { name: string; path: string; storagePath: string };

async function collectFileEntries(
  supabase: SupabaseClient,
  docId: string,
  pathPrefix: string
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const { data: doc } = await supabase
    .from("documents")
    .select("type, name, storage_path")
    .eq("id", docId)
    .single();

  if (doc?.type === "file" && doc.storage_path) {
    entries.push({ name: doc.name, path: pathPrefix + doc.name, storagePath: doc.storage_path });
  }

  const { data: children } = await supabase
    .from("documents")
    .select("id, name")
    .eq("parent_id", docId);

  for (const child of children || []) {
    const childPrefix = doc?.type === "folder" ? pathPrefix + doc.name + "/" : pathPrefix;
    const childEntries = await collectFileEntries(supabase, child.id, childPrefix);
    entries.push(...childEntries);
  }

  return entries;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();

  // Get the folder name for the zip filename
  const { data: folder } = await supabase
    .from("documents")
    .select("name, type")
    .eq("id", docId)
    .eq("project_id", projectId)
    .single();

  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await collectFileEntries(supabase, docId, "");

  const zip = new JSZip();

  for (const entry of entries) {
    const { data: fileData, error } = await supabase.storage
      .from("project-documents")
      .download(entry.storagePath);
    if (error || !fileData) continue;
    const buffer = await fileData.arrayBuffer();
    zip.file(entry.path, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const zipName = `${folder.name}.zip`;

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}
