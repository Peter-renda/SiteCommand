import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";
import { getSupabase } from "@/lib/supabase";
import { logChangeEventHistory } from "@/lib/change-event-history";

type Params = { params: Promise<{ id: string; meetingId: string }> };

export async function POST(_: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, meetingId } = await params;
  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id, title, meeting_number, overview, notes")
    .eq("id", meetingId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  const { data: latestEvent } = await supabase
    .from("change_events")
    .select("number")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (latestEvent?.number ?? 0) + 1;
  const origin = `Meeting #${meeting.meeting_number}: ${meeting.title}`;

  const descriptionParts = [meeting.overview?.trim(), meeting.notes?.trim()].filter(Boolean);
  const description =
    descriptionParts.length > 0
      ? descriptionParts
          .map((value, idx) => (idx === 0 ? String(value) : `Meeting Notes:\n${String(value)}`))
          .join("\n\n")
      : null;

  const { data: created, error: createError } = await supabase
    .from("change_events")
    .insert({
      project_id: projectId,
      number: nextNumber,
      title: meeting.title,
      status: "Open",
      origin,
      description,
      created_by: session.id,
    })
    .select("id, number, title")
    .single();

  if (createError || !created) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create change event." }, { status: 500 });
  }

  await logChangeEventHistory(
    supabase,
    session,
    created.id,
    projectId,
    "This change event was created",
    null,
    `Change Event #${String(created.number).padStart(3, "0")}`
  );

  return NextResponse.json({
    id: created.id,
    number: created.number,
    title: created.title,
  });
}
