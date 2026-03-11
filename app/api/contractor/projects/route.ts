import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "contractor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("project_contractors")
    .select("project_id, projects(id, name, address, city, state, status)")
    .eq("user_id", session.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const projects = (data ?? []).map((row: Record<string, unknown>) => row.projects).filter(Boolean);
  return NextResponse.json(projects);
}
