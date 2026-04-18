import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("project_locations")
    .select("*")
    .eq("project_id", projectId)
    .order("path", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const name = String(body.name || "").trim();
  const parentId = body.parent_id ? String(body.parent_id) : null;

  if (!name) return NextResponse.json({ error: "Location name is required" }, { status: 400 });

  let parentPath = "";
  if (parentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("project_locations")
      .select("id,path")
      .eq("id", parentId)
      .eq("project_id", projectId)
      .single();

    if (parentErr || !parent) {
      return NextResponse.json({ error: "Parent location was not found" }, { status: 400 });
    }
    parentPath = parent.path;
  }

  const path = parentPath ? `${parentPath} > ${name}` : name;

  const { data, error } = await supabase
    .from("project_locations")
    .insert({
      project_id: projectId,
      parent_id: parentId,
      name,
      path,
      created_by: session.id,
    })
    .select("*")
    .single();

  if (error) {
    const alreadyExists = error.message?.toLowerCase().includes("duplicate") || error.code === "23505";
    if (alreadyExists) return NextResponse.json({ error: "Location path already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
