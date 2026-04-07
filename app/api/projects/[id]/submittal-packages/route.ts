import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("submittal_packages")
    .select("*")
    .eq("project_id", projectId)
    .order("package_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("submittal_packages")
    .select("package_number")
    .eq("project_id", projectId)
    .order("package_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.package_number ?? 0) + 1;

  const body = await req.json();
  const { title, specification_id, description, attachments, submittal_ids } = body;

  const { data: pkg, error } = await supabase
    .from("submittal_packages")
    .insert({
      project_id: projectId,
      package_number: nextNumber,
      title: (title ?? "").toString().trim() || "Untitled Package",
      specification_id: specification_id || null,
      description: description || null,
      attachments: attachments ?? [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(submittal_ids) && submittal_ids.length > 0) {
    const items = submittal_ids.map((sid: string) => ({
      package_id: pkg.id,
      submittal_id: sid,
    }));
    await supabase.from("submittal_package_items").insert(items);
  }

  return NextResponse.json(pkg);
}
