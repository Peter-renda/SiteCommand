import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*, project_members(users(id, username, email))")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Non-admins can only view projects they're a member of
  if (session.role !== "admin") {
    const members = (data.project_members as { users: { id: string } }[]) || [];
    const isMember = members.some((pm) => pm.users?.id === session.id);
    if (!isMember) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { project_members, ...rest } = data;
  const project = {
    ...rest,
    members: ((project_members as { users: unknown }[]) || []).map((pm) => pm.users).filter(Boolean),
  };

  return NextResponse.json(project);
}
