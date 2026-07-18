/**
 * Community → Office hours with experienced PMs.
 *
 * GET  /api/community/office-hours — upcoming sessions (soonest first) with
 *      seat counts and whether the caller has reserved a seat / hosts it.
 * POST /api/community/office-hours — host a session. Body: { topic, startsAt,
 *      description?, hostTitle?, durationMinutes?, capacity?, meetingLink?,
 *      region? }. Any logged-in user (experienced PMs offering time).
 * DELETE /api/community/office-hours?id=… — the host cancels their session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isRegion, resolveDisplayName } from "@/lib/community";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  host_user_id: string;
  host_name: string;
  host_title: string;
  topic: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  meeting_link: string;
  region: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  // Show sessions that haven't already ended (small grace window).
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("community_office_hours")
    .select(
      "id, host_user_id, host_name, host_title, topic, description, starts_at, duration_minutes, capacity, meeting_link, region",
    )
    .gte("starts_at", cutoff)
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const ids = rows.map((r) => r.id);
  const signupCount = new Map<string, number>();
  const mySignups = new Set<string>();
  if (ids.length > 0) {
    const { data: signups } = await supabase
      .from("community_office_hour_signups")
      .select("session_id, user_id")
      .in("session_id", ids);
    for (const s of (signups ?? []) as { session_id: string; user_id: string }[]) {
      signupCount.set(s.session_id, (signupCount.get(s.session_id) ?? 0) + 1);
      if (s.user_id === session.id) mySignups.add(s.session_id);
    }
  }

  return NextResponse.json({
    sessions: rows.map((r) => ({
      id: r.id,
      hostName: r.host_name,
      hostTitle: r.host_title,
      topic: r.topic,
      description: r.description,
      startsAt: r.starts_at,
      durationMinutes: r.duration_minutes,
      capacity: r.capacity,
      meetingLink: r.meeting_link,
      region: r.region,
      reserved: signupCount.get(r.id) ?? 0,
      isSignedUp: mySignups.has(r.id),
      isHost: r.host_user_id === session.id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    topic?: unknown;
    startsAt?: unknown;
    description?: unknown;
    hostTitle?: unknown;
    durationMinutes?: unknown;
    capacity?: unknown;
    meetingLink?: unknown;
    region?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const startsAtRaw = typeof body.startsAt === "string" ? body.startsAt : "";
  const startsMs = Date.parse(startsAtRaw);
  if (!topic) return NextResponse.json({ error: "A topic is required" }, { status: 400 });
  if (Number.isNaN(startsMs)) return NextResponse.json({ error: "A valid start time is required" }, { status: 400 });

  const durationRaw = Number(body.durationMinutes);
  const durationMinutes = Number.isFinite(durationRaw) ? Math.max(15, Math.min(180, Math.round(durationRaw))) : 30;
  const capacityRaw = Number(body.capacity);
  const capacity = Number.isFinite(capacityRaw) ? Math.max(1, Math.min(100, Math.round(capacityRaw))) : 5;

  const supabase = getSupabase();
  const hostName = await resolveDisplayName(supabase, session.id, session.username || session.email);

  const { data, error } = await supabase
    .from("community_office_hours")
    .insert({
      host_user_id: session.id,
      host_name: hostName,
      host_title: typeof body.hostTitle === "string" ? body.hostTitle.trim().slice(0, 160) : "",
      topic: topic.slice(0, 200),
      description: typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "",
      starts_at: new Date(startsMs).toISOString(),
      duration_minutes: durationMinutes,
      capacity,
      meeting_link: typeof body.meetingLink === "string" ? body.meetingLink.trim().slice(0, 500) : "",
      region: isRegion(body.region) ? body.region : "",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("community_office_hours")
    .select("host_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.host_user_id !== session.id) {
    return NextResponse.json({ error: "Only the host can cancel this session" }, { status: 403 });
  }

  const { error } = await supabase.from("community_office_hours").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
