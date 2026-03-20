import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// Count PDF pages by scanning the binary for the Pages tree /Count entry.
// This runs server-side in Node.js — no web worker or browser API needed.
function countPdfPages(buf: Buffer): number {
  const text = buf.toString("latin1");
  // The root Pages dictionary has the highest /Count value
  const rx = /\/Count\s+(\d+)/g;
  let m: RegExpExecArray | null;
  let max = 0;
  while ((m = rx.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  if (max > 0) return max;
  // Fallback: count /Type /Page objects (excludes /Pages parent nodes)
  const pages = text.match(/\/Type\s*\/Page[^s]/g);
  return pages ? pages.length : 1;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const [drawingsRes, uploadsRes] = await Promise.all([
    supabase
      .from("project_drawings")
      .select(`
        *,
        drawing_uploads!inner(storage_path, filename, uploaded_by_name, uploaded_at)
      `)
      .eq("project_id", projectId)
      .order("upload_id")
      .order("page_number"),
    supabase
      .from("drawing_uploads")
      .select("*")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false }),
  ]);

  if (drawingsRes.error) return NextResponse.json({ error: drawingsRes.error.message }, { status: 500 });
  if (uploadsRes.error) return NextResponse.json({ error: uploadsRes.error.message }, { status: 500 });

  // Flatten joined fields
  const drawings = (drawingsRes.data ?? []).map((d: Record<string, unknown>) => {
    const upload = d.drawing_uploads as Record<string, unknown>;
    const { drawing_uploads: _, ...rest } = d;
    void _;
    return {
      ...rest,
      storage_path: upload.storage_path,
      filename: upload.filename,
      uploaded_by_name: upload.uploaded_by_name,
      uploaded_at: upload.uploaded_at,
    };
  });

  return NextResponse.json({ drawings, uploads: uploadsRes.data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  // Read file buffer once — used for both page counting and storage upload
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const pageCount = countPdfPages(fileBuffer);

  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${projectId}/${timestamp}-${safeFilename}`;

  const { error: uploadError } = await supabase.storage
    .from("project-drawings")
    .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: uploadRow, error: insertUploadError } = await supabase
    .from("drawing_uploads")
    .insert({
      project_id: projectId,
      storage_path: storagePath,
      filename: file.name,
      page_count: pageCount,
      uploaded_by_name: session.username,
    })
    .select()
    .single();

  if (insertUploadError) return NextResponse.json({ error: insertUploadError.message }, { status: 500 });

  const drawingRows = Array.from({ length: pageCount }, (_, i) => ({
    project_id: projectId,
    upload_id: uploadRow.id,
    page_number: i + 1,
  }));

  const { data: drawings, error: insertDrawingsError } = await supabase
    .from("project_drawings")
    .insert(drawingRows)
    .select();

  if (insertDrawingsError) return NextResponse.json({ error: insertDrawingsError.message }, { status: 500 });

  return NextResponse.json({ upload: uploadRow, drawings: drawings ?? [] });
}
