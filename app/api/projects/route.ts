import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (session.role !== "admin") {
    if (!session.company_id) return NextResponse.json([]);
    query = query.eq("company_id", session.company_id);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const canCreate = session?.role === "admin" || session?.company_role === "admin";
  if (!session || !canCreate) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name, description, address, zip_code, city, state, county,
    project_number, sector, value, status,
    start_date, actual_start_date, completion_date,
    projected_finish_date, warranty_start_date, warranty_end_date,
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
      company_id: session.role === "admin" ? null : session.company_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create project" }, { status: 500 });

  return NextResponse.json({ ...project, members: [] });
}
