import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const filename = new URL(req.url).searchParams.get("filename") ?? "document";
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${projectId}/${crypto.randomUUID()}/${safeFilename}`;

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUploadUrl(storagePath);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl && !data.signedUrl.startsWith("http")) {
    return NextResponse.json({ error: "Supabase URL is not configured" }, { status: 500 });
  }

  const signedUrl = data.signedUrl.startsWith("http")
    ? data.signedUrl
    : `${supabaseUrl}${data.signedUrl}`;

  return NextResponse.json({ signedUrl, storagePath });
}
