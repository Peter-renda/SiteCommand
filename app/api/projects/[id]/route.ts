import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const canEdit = session?.company_role === "admin" || session?.company_role === "super_admin";
  if (!session || !canEdit) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, description, address, city, state, zip_code, value, status } = await req.json();

  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .update({ name, description, address, city, state, zip_code, value: parseFloat(value) || 0, status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(supabase, {
    projectId: id,
    userId: session.id,
    type: "project_updated",
    description: "Project details updated",
  });

  return NextResponse.json(project);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (data.company_id !== session.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ...data, members: [] });
}
