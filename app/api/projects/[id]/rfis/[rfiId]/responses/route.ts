import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase.from("rfis").select("id").eq("id", rfiId).eq("project_id", projectId).single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("rfi_responses")
    .select("id, body, created_by, created_at")
    .eq("rfi_id", rfiId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase.from("rfis").select("id").eq("id", rfiId).eq("project_id", projectId).single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { body } = await req.json();
  if (!body || typeof body !== "string") return NextResponse.json({ error: "Body is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("rfi_responses")
    .insert({ rfi_id: rfiId, body: body.trim(), created_by: session.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
