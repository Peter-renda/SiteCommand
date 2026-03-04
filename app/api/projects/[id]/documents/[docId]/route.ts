import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

async function collectFilePaths(supabase: SupabaseClient, docId: string): Promise<string[]> {
  const paths: string[] = [];
  const { data: doc } = await supabase.from("documents").select("type, storage_path").eq("id", docId).single();
  if (doc?.type === "file" && doc.storage_path) paths.push(doc.storage_path);
  const { data: children } = await supabase.from("documents").select("id").eq("parent_id", docId);
  for (const child of children || []) paths.push(...(await collectFilePaths(supabase, child.id)));
  return paths;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.parent_id !== undefined) update.parent_id = body.parent_id;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", docId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const action = body.name !== undefined ? `Renamed document to "${data.name}"` : `Moved document "${data.name}"`;
  await logActivity(supabase, { projectId, userId: session.id, type: "document_updated", description: action });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();
  const { data: docRecord } = await supabase.from("documents").select("name, type").eq("id", docId).single();

  const paths = await collectFilePaths(supabase, docId);
  if (paths.length > 0) await supabase.storage.from("project-documents").remove(paths);
  await supabase.from("documents").delete().eq("id", docId).eq("project_id", projectId);

  await logActivity(supabase, { projectId, userId: session.id, type: "document_deleted", description: `Deleted ${docRecord?.type ?? "document"}: ${docRecord?.name ?? docId}` });
  return NextResponse.json({ ok: true });
}
