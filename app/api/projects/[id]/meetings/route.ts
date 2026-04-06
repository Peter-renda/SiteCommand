import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("meeting_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("meetings")
    .select("meeting_number")
    .eq("project_id", projectId)
    .order("meeting_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.meeting_number ?? 0) + 1;

  const body = await req.json();
  const { title, series, overview, date, end_date, location, status, template } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      project_id: projectId,
      meeting_number: nextNumber,
      title: title.trim(),
      series: series?.trim() || null,
      overview: overview?.trim() || null,
      date: date || null,
      end_date: end_date || null,
      location: location?.trim() || null,
      status: status || "scheduled",
      template: template?.trim() || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
