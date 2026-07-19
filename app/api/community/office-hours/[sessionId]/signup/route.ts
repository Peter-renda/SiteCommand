/**
 * Community → Office hours: reserve / release a seat.
 *
 * POST /api/community/office-hours/[sessionId]/signup — toggle the caller's
 *      reservation. Reserves a seat if capacity remains; releasing is always
 *      allowed. Returns the new reserved count + isSignedUp. Hosts can't
 *      reserve their own session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { resolveDisplayName } from "@/lib/community";
import { sendOfficeHourReservationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function communityUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/community`
    : "/community";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;

  const supabase = getSupabase();
  const { data: slot } = await supabase
    .from("community_office_hours")
    .select("id, host_user_id, host_name, topic, starts_at, capacity")
    .eq("id", sessionId)
    .maybeSingle();
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.host_user_id === session.id) {
    return NextResponse.json({ error: "You're hosting this session" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("community_office_hour_signups")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", session.id)
    .maybeSingle();

  let attendeeName = "";
  if (existing) {
    // Release the seat.
    await supabase.from("community_office_hour_signups").delete().eq("id", existing.id);
  } else {
    // Reserve — enforce capacity.
    const { count } = await supabase
      .from("community_office_hour_signups")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if ((count ?? 0) >= slot.capacity) {
      return NextResponse.json({ error: "This session is full" }, { status: 409 });
    }
    attendeeName = await resolveDisplayName(supabase, session.id, session.username || session.email);
    const { error } = await supabase.from("community_office_hour_signups").insert({
      session_id: sessionId,
      user_id: session.id,
      user_name: attendeeName,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: reserved } = await supabase
    .from("community_office_hour_signups")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  // Notify the host on a new reservation (best-effort, non-fatal).
  if (!existing) {
    try {
      const { data: host } = await supabase
        .from("users")
        .select("email")
        .eq("id", slot.host_user_id)
        .maybeSingle();
      if (host?.email) {
        await sendOfficeHourReservationEmail({
          to: host.email,
          hostName: slot.host_name,
          attendeeName,
          topic: slot.topic,
          startsAt: slot.starts_at,
          reserved: reserved ?? 0,
          capacity: slot.capacity,
          communityUrl: communityUrl(),
        });
      }
    } catch (err) {
      console.error("[community] office-hour reservation email failed", err);
    }
  }

  return NextResponse.json({ reserved: reserved ?? 0, isSignedUp: !existing });
}
