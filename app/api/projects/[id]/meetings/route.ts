import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

function isMeetingNumberConflict(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("meetings_project_id_meeting_number_key");
}

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

  async function getNextMeetingNumber() {
    const { data: maxRow } = await supabase
      .from("meetings")
      .select("meeting_number")
      .eq("project_id", projectId)
      .order("meeting_number", { ascending: false })
      .limit(1)
      .single();
    return (maxRow?.meeting_number ?? 0) + 1;
  }

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

  const requestedNumber =
    typeof meeting_number === "number" && meeting_number > 0 ? meeting_number : null;

  const basePayload = {
    project_id: projectId,
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
  };

  let resolvedNumber = requestedNumber ?? await getNextMeetingNumber();
  let data: unknown = null;
  let error: { message?: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const insertRes = await supabase
      .from("meetings")
      .insert({ ...basePayload, meeting_number: resolvedNumber })
      .select()
      .single();

    data = insertRes.data;
    error = insertRes.error;
    if (!error) break;

    // For auto-numbered meetings, retry on unique collision to avoid race conditions.
    if (requestedNumber == null && isMeetingNumberConflict(error.message)) {
      resolvedNumber = await getNextMeetingNumber();
      continue;
    }
    break;
  }

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
