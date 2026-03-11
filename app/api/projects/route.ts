import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // System admin: all projects across all tenants
  if (session.role === "admin") {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }

  // Internal company user: every project owned by their company
  if (session.company_id) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }

  // External collaborator (no company): only projects they were explicitly
  // invited to via project_memberships
  const { data: memberships } = await supabase
    .from("project_memberships")
    .select("project_id")
    .eq("user_id", session.id);

  if (!memberships || memberships.length === 0) return NextResponse.json([]);

  const projectIds = memberships.map((m: { project_id: string }) => m.project_id);
  const { data } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  // External collaborators (no company) may never create projects.
  // Only system admins and internal company admins can.
  const canCreate = session?.role === "admin" || session?.company_role === "admin";
  if (!session || !canCreate || (!session.company_id && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name, description, address, zip_code, city, state, county,
    project_number, sector, value, status,
    start_date, actual_start_date, completion_date,
    projected_finish_date, warranty_start_date, warranty_end_date,
    company_id: bodyCompanyId,
    memberIds,
  } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name, description, address, zip_code, city, state, county,
      project_number, sector,
      value: parseFloat(value) || 0,
      status: status || "bidding",
      start_date: start_date || null,
      actual_start_date: actual_start_date || null,
      completion_date: completion_date || null,
      projected_finish_date: projected_finish_date || null,
      warranty_start_date: warranty_start_date || null,
      warranty_end_date: warranty_end_date || null,
      company_id: session.role === "admin" ? (bodyCompanyId || null) : session.company_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create project" }, { status: 500 });

  // Add initial members to project_memberships
  if (Array.isArray(memberIds) && memberIds.length > 0) {
    const companyId = session.role === "admin" ? (bodyCompanyId || null) : session.company_id;
    await supabase.from("project_memberships").insert(
      memberIds.map((uid: string) => ({
        project_id: project.id,
        user_id: uid,
        company_id: companyId,
        role: "member",
        invited_by: session.id,
      }))
    );
  }

  return NextResponse.json({ ...project, members: [] });
}
