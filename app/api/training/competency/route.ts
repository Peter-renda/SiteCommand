/**
 * GET /api/training/competency — the current user's competency profile:
 * per-skill scores/levels with evidence, headline stats, credential
 * eligibility, and the existing credential (if issued). Backs the
 * Training → Skills & Credential page.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { computeCompetencyProfile } from "@/lib/training-competency";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const profile = await computeCompetencyProfile(supabase, session.id);

  const { data: credential } = await supabase
    .from("training_credentials")
    .select("code, title, overall_level, overall_score, issued_at, updated_at")
    .eq("user_id", session.id)
    .maybeSingle();

  return NextResponse.json({ ...profile, credential: credential ?? null });
}
