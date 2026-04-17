import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const { data: pkg, error: pkgError } = await supabase
    .from("submittal_packages")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", packageId)
    .single();

  if (pkgError || !pkg) return NextResponse.json({ error: "Submittal package not found" }, { status: 404 });

  const { data: links, error: linksError } = await supabase
    .from("submittal_package_items")
    .select("submittal_id")
    .eq("package_id", packageId);

  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

  const submittalIds = (links ?? []).map((row) => row.submittal_id);
  let submittals: unknown[] = [];
  if (submittalIds.length > 0) {
    const { data, error } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .order("submittal_number", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    submittals = data ?? [];
  }

  return NextResponse.json({ ...pkg, submittals });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const { title, specification_id, description } = await req.json();

  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = String(title ?? "").trim() || "Untitled Package";
  if (specification_id !== undefined) update.specification_id = specification_id || null;
  if (description !== undefined) update.description = description || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No editable fields were provided" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("submittal_packages")
    .update(update)
    .eq("id", packageId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("submittal_packages")
    .delete()
    .eq("id", packageId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
