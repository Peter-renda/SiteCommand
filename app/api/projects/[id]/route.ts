import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canAccessProject } from "@/lib/project-access";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const canEdit = session?.company_role === "admin" || session?.company_role === "super_admin";
  if (!session || !canEdit) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const {
    name, description, address, city, state, zip_code, value, status,
    project_number, sector, county,
    start_date, actual_start_date, completion_date,
    projected_finish_date, warranty_start_date, warranty_end_date,
  } = await req.json();

  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      name, description, address, city, state, zip_code,
      value: parseFloat(value) || 0, status,
      project_number: project_number || null,
      sector: sector || null,
      county: county || null,
      start_date: start_date || null,
      actual_start_date: actual_start_date || null,
      completion_date: completion_date || null,
      projected_finish_date: projected_finish_date || null,
      warranty_start_date: warranty_start_date || null,
      warranty_end_date: warranty_end_date || null,
    })
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

  const hasAccess = await canAccessProject(id, session);
  if (!hasAccess) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ...data, members: [] });
}
