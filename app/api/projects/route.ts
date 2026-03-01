import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  let projectIds: string[] | null = null;

  // Non-admins only see projects they're a member of
  if (session.role !== "admin") {
    const { data: memberships } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", session.id);

    projectIds = (memberships || []).map((m) => m.project_id);
    if (projectIds.length === 0) return NextResponse.json([]);
  }

  let query = supabase
    .from("projects")
    .select("*, project_members(users(id, username, email))")
    .order("created_at", { ascending: false });

  if (projectIds !== null) {
    query = query.in("id", projectIds);
  }

  const { data } = await query;

  const projects = (data || []).map((p: Record<string, unknown>) => {
    const { project_members, ...rest } = p;
    return {
      ...rest,
      members: ((project_members as { users: unknown }[]) || [])
        .map((pm) => pm.users)
        .filter(Boolean),
    };
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, address, zip_code, value, status, memberIds } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, description, address, zip_code, value: parseFloat(value) || 0, status: status || "bidding" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create project" }, { status: 500 });

  if (memberIds && memberIds.length > 0) {
    await supabase.from("project_members").insert(
      memberIds.map((userId: string) => ({ project_id: project.id, user_id: userId }))
    );
  }

  return NextResponse.json({ ...project, members: [] });
}
