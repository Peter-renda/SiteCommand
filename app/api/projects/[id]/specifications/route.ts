import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("project_specifications")
    .select("id, name, code")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const canEdit = session?.company_role === "admin" || session?.company_role === "super_admin";
  if (!session || !canEdit) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const body = await req.json();
  const { name, code } = body;
  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_specifications")
    .insert({ project_id: projectId, name: name.trim(), code: code?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
