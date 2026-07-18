/**
 * Community → Mentorship matching.
 *
 * GET  /api/community/mentorship — the caller's own profile (if any), the full
 *      directory of available mentors + mentees, and — when the caller has a
 *      profile — a ranked list of suggested counterparts (mentees see mentors
 *      and vice-versa) scored by focus-area overlap + shared region.
 * POST /api/community/mentorship — create/update the caller's profile. Body:
 *      { role, displayName?, yearsExperience?, focusAreas?, region?, bio?,
 *        contact?, available? }.
 * DELETE /api/community/mentorship — remove the caller's profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  FOCUS_AREAS,
  MENTORSHIP_ROLES,
  focusOverlap,
  isRegion,
  resolveDisplayName,
  type MentorshipRole,
} from "@/lib/community";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  years_experience: number;
  focus_areas: unknown;
  region: string;
  bio: string;
  contact: string;
  available: boolean;
  updated_at: string;
};

function focusList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function serialize(row: Row) {
  return {
    id: row.id,
    displayName: row.display_name,
    role: row.role as MentorshipRole,
    yearsExperience: row.years_experience,
    focusAreas: focusList(row.focus_areas),
    region: row.region,
    bio: row.bio,
    contact: row.contact,
    available: row.available,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("community_mentorship_profiles")
    .select(
      "id, user_id, display_name, role, years_experience, focus_areas, region, bio, contact, available, updated_at",
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const mine = rows.find((r) => r.user_id === session.id) ?? null;
  const directory = rows
    .filter((r) => r.user_id !== session.id && r.available)
    .map(serialize);

  // Suggested matches: the opposite role, ranked by focus overlap (+ region).
  let matches: (ReturnType<typeof serialize> & { matchScore: number })[] = [];
  if (mine) {
    const wantRole = mine.role === "mentee" ? "mentor" : "mentee";
    const myFocus = focusList(mine.focus_areas);
    matches = rows
      .filter((r) => r.user_id !== session.id && r.available && r.role === wantRole)
      .map((r) => {
        const overlap = focusOverlap(myFocus, focusList(r.focus_areas));
        const regionBonus = mine.region && r.region === mine.region ? 0.25 : 0;
        return { ...serialize(r), matchScore: Math.round((overlap + regionBonus) * 100) };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12);
  }

  return NextResponse.json({
    profile: mine ? serialize(mine) : null,
    directory,
    matches,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    role?: unknown;
    displayName?: unknown;
    yearsExperience?: unknown;
    focusAreas?: unknown;
    region?: unknown;
    bio?: unknown;
    contact?: unknown;
    available?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const role = MENTORSHIP_ROLES.includes(body.role as MentorshipRole)
    ? (body.role as MentorshipRole)
    : null;
  if (!role) return NextResponse.json({ error: "role must be mentor or mentee" }, { status: 400 });

  const focusAreas = Array.isArray(body.focusAreas)
    ? body.focusAreas.filter(
        (x): x is string => typeof x === "string" && (FOCUS_AREAS as readonly string[]).includes(x),
      )
    : [];
  const region = isRegion(body.region) ? body.region : "";
  const yearsRaw = Number(body.yearsExperience);
  const yearsExperience = Number.isFinite(yearsRaw) ? Math.max(0, Math.min(60, Math.round(yearsRaw))) : 0;

  const supabase = getSupabase();
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120)
      : await resolveDisplayName(supabase, session.id, session.username || session.email);

  const { data, error } = await supabase
    .from("community_mentorship_profiles")
    .upsert(
      {
        user_id: session.id,
        display_name: displayName,
        role,
        years_experience: yearsExperience,
        focus_areas: focusAreas,
        region,
        bio: typeof body.bio === "string" ? body.bio.trim().slice(0, 2000) : "",
        contact: typeof body.contact === "string" ? body.contact.trim().slice(0, 200) : "",
        available: body.available === undefined ? true : Boolean(body.available),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(
      "id, user_id, display_name, role, years_experience, focus_areas, region, bio, contact, available, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: serialize(data as Row) });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("community_mentorship_profiles")
    .delete()
    .eq("user_id", session.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
