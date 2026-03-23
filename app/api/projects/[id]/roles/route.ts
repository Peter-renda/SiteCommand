import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getProjectRole } from "@/lib/project-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const role = await getProjectRole(projectId, session);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("project_roles")
    .eq("id", projectId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  return NextResponse.json(data?.project_roles || {});
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const isAdmin =
    session.company_role === "super_admin" ||
    session.company_role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("projects")
    .update({ project_roles: body })
    .eq("id", projectId);

  if (error) return NextResponse.json({ error: "Failed to save roles" }, { status: 500 });
  return NextResponse.json({ success: true });
}
