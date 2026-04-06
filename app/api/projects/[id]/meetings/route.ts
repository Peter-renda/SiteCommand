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
  const {
    meeting_number,
    title,
    series,
    overview,
    date,
    end_date,
    location,
    status,
    template,
    meeting_link,
    timezone,
    start_time,
    end_time,
    is_private,
    is_draft,
    attendees,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const resolvedNumber =
    typeof meeting_number === "number" && meeting_number > 0 ? meeting_number : nextNumber;

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      project_id: projectId,
      meeting_number: resolvedNumber,
      title: title.trim(),
      series: series?.trim() || null,
      overview: overview?.trim() || null,
      date: date || null,
      end_date: end_date || null,
      location: location?.trim() || null,
      status: is_draft ? "draft" : status || "scheduled",
      template: template?.trim() || null,
      meeting_link: meeting_link?.trim() || null,
      timezone: timezone || "America/New_York",
      start_time: start_time || null,
      end_time: end_time || null,
      is_private: is_private ?? true,
      is_draft: is_draft ?? false,
      attendees: attendees || [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GET next meeting number (used by the new meeting page)
export async function HEAD(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

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
  return new NextResponse(null, { status: 200, headers: { "x-next-number": String(nextNumber) } });
}
