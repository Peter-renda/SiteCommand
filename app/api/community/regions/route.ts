/**
 * Community → Regional networking.
 *
 * GET  /api/community/regions — every region with its members (grouped),
 *      plus the caller's own membership.
 * POST /api/community/regions — join / update the caller's regional listing.
 *      Body: { region, city?, headline?, contact?, displayName? }.
 * DELETE /api/community/regions — leave (remove the caller's listing).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { REGIONS, isRegion, resolveDisplayName } from "@/lib/community";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  display_name: string;
  region: string;
  city: string;
  headline: string;
  contact: string;
};

function serialize(row: Row, currentUserId: string) {
  return {
    id: row.id,
    displayName: row.display_name,
    region: row.region,
    city: row.city,
    headline: row.headline,
    contact: row.contact,
    mine: row.user_id === currentUserId,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("community_region_members")
    .select("id, user_id, display_name, region, city, headline, contact")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const byRegion: Record<string, ReturnType<typeof serialize>[]> = {};
  for (const region of REGIONS) byRegion[region] = [];
  for (const r of rows) {
    (byRegion[r.region] ??= []).push(serialize(r, session.id));
  }

  const regions = REGIONS.map((region) => ({
    region,
    members: byRegion[region] ?? [],
    count: (byRegion[region] ?? []).length,
  }));

  const mine = rows.find((r) => r.user_id === session.id) ?? null;
  return NextResponse.json({ regions, profile: mine ? serialize(mine, session.id) : null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    region?: unknown;
    city?: unknown;
    headline?: unknown;
    contact?: unknown;
    displayName?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  if (!isRegion(body.region)) {
    return NextResponse.json({ error: "A valid region is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120)
      : await resolveDisplayName(supabase, session.id, session.username || session.email);

  const { data, error } = await supabase
    .from("community_region_members")
    .upsert(
      {
        user_id: session.id,
        display_name: displayName,
        region: body.region,
        city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : "",
        headline: typeof body.headline === "string" ? body.headline.trim().slice(0, 200) : "",
        contact: typeof body.contact === "string" ? body.contact.trim().slice(0, 200) : "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id, user_id, display_name, region, city, headline, contact")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: serialize(data as Row, session.id) });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("community_region_members")
    .delete()
    .eq("user_id", session.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
