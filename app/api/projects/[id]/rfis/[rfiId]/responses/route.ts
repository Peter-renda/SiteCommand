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
    .select("id, body, created_by, created_at, attachments, users(username, first_name, last_name)")
    .eq("rfi_id", rfiId)
    .order("created_at", { ascending: false });

  // If attachments column doesn't exist yet (migration pending), fall back without it
  let rows = data;
  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("rfi_responses")
      .select("id, body, created_by, created_at, users(username, first_name, last_name)")
      .eq("rfi_id", rfiId)
      .order("created_at", { ascending: false });
    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    rows = fallback;
  }

  const responses = (rows || []).map((r: {
    id: string;
    body: string;
    created_by: string | null;
    created_at: string;
    attachments?: { name: string; url: string }[] | null;
    users: { username: string; first_name: string | null; last_name: string | null } | null;
  }) => {
    const u = r.users;
    const created_by_name = u
      ? ([u.first_name, u.last_name].filter(Boolean).join(" ") || u.username)
      : null;
    return { id: r.id, body: r.body, created_by: r.created_by, created_at: r.created_at, created_by_name, attachments: r.attachments ?? [] };
  });

  return NextResponse.json(responses);
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
    .select("id, body, created_by, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const created_by_name = [session.username].filter(Boolean).join("") || null;
  return NextResponse.json({ ...data, created_by_name, attachments: [] });
}
