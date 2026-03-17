import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { addUserToDirectory } from "@/lib/directory";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (!user?.company_id) {
    return NextResponse.json({ projects: [] });
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("company_id", user.company_id)
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase
    .from("project_memberships")
    .select("project_id")
    .eq("user_id", userId);

  const accessSet = new Set((memberships || []).map((m: { project_id: string }) => m.project_id));

  return NextResponse.json({
    projects: (projects || []).map((p: { id: string; name: string; status: string }) => ({
      ...p,
      hasAccess: accessSet.has(p.id),
    })),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const { projectIds } = await req.json();
  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (!user?.company_id) {
    return NextResponse.json({ error: "User has no company" }, { status: 400 });
  }

  const { data: companyProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", user.company_id);

  const companyProjectIds = (companyProjects || []).map((p: { id: string }) => p.id);

  // Clear existing memberships for company projects
  if (companyProjectIds.length > 0) {
    await supabase
      .from("project_memberships")
      .delete()
      .eq("user_id", userId)
      .in("project_id", companyProjectIds);
  }

  // Insert new memberships and sync to directory
  if (projectIds && projectIds.length > 0) {
    await supabase
      .from("project_memberships")
      .insert(
        projectIds.map((pid: string) => ({
          project_id: pid,
          user_id: userId,
          company_id: user.company_id,
          role: "member",
        }))
      );

    await Promise.all(
      projectIds.map((pid: string) => addUserToDirectory(supabase, pid, userId))
    );
  }

  return NextResponse.json({ success: true });
}
