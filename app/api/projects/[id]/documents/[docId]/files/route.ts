import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { SupabaseClient } from "@supabase/supabase-js";

async function collectFiles(supabase: SupabaseClient, docId: string): Promise<{ name: string; url: string }[]> {
  const files: { name: string; url: string }[] = [];
  const { data: doc } = await supabase.from("documents").select("type, name, storage_path").eq("id", docId).single();

  if (doc?.type === "file" && doc.storage_path) {
    const { data: { publicUrl } } = supabase.storage.from("project-documents").getPublicUrl(doc.storage_path);
    files.push({ name: doc.name, url: publicUrl });
  }

  const { data: children } = await supabase.from("documents").select("id").eq("parent_id", docId);
  for (const child of children || []) {
    files.push(...(await collectFiles(supabase, child.id)));
  }

  return files;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;
  const supabase = getSupabase();
  const files = await collectFiles(supabase, docId);
  return NextResponse.json(files);
}
