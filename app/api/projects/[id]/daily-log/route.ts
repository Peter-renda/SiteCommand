import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const date = new URL(req.url).searchParams.get("date");
  const supabase = getSupabase();

  if (date) {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("project_id", projectId)
      .eq("log_date", date)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? null);
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("log_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const body = await req.json();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({ ...body, project_id: projectId, created_by: session.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { id, ...body } = await req.json();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
