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

  // Fetch ALL projects (system admin can assign any project to any user)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
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

  // Fetch all projects so we can look up each project's company_id
  const { data: allProjects } = await supabase
    .from("projects")
    .select("id, company_id");

  const projectCompanyMap = Object.fromEntries(
    (allProjects || []).map((p: { id: string; company_id: string | null }) => [p.id, p.company_id])
  );

  // Clear ALL existing project memberships for this user (full replacement)
  await supabase
    .from("project_memberships")
    .delete()
    .eq("user_id", userId);

  // Insert new memberships using each project's own company_id
  if (projectIds && projectIds.length > 0) {
    await supabase
      .from("project_memberships")
      .insert(
        projectIds.map((pid: string) => ({
          project_id: pid,
          user_id: userId,
          company_id: projectCompanyMap[pid] ?? null,
          role: "member",
          permission: "write",
        }))
      );

    await Promise.all(
      projectIds.map((pid: string) => addUserToDirectory(supabase, pid, userId))
    );
  }

  return NextResponse.json({ success: true });
}
