/**
 * The trainee's verifiable credential ("SiteCommand Certified").
 *
 * GET  /api/training/credential  — the caller's credential, or null.
 * POST /api/training/credential  — issue (or refresh) the credential. Requires
 *      the competency profile's eligibility bar to be met. Re-issuing
 *      refreshes the profile snapshot/score but keeps the same public code so
 *      shared verification links never break.
 *
 * Verification is public: /verify/[code] renders the stored snapshot.
 */

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { computeCompetencyProfile } from "@/lib/training-competency";

export const dynamic = "force-dynamic";

// No 0/O/1/I — codes get read aloud and retyped from resumes.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateCode(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `SC-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: credential } = await getSupabase()
    .from("training_credentials")
    .select("code, holder_name, title, overall_level, overall_score, issued_at, updated_at")
    .eq("user_id", session.id)
    .maybeSingle();

  return NextResponse.json({ credential: credential ?? null });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const profile = await computeCompetencyProfile(supabase, session.id);
  if (!profile.eligibility.eligible) {
    return NextResponse.json(
      {
        error: "Not yet eligible for a credential",
        rules: profile.eligibility.rules,
      },
      { status: 422 },
    );
  }

  const { data: user } = await supabase
    .from("users")
    .select("first_name, last_name, username, email")
    .eq("id", session.id)
    .maybeSingle();
  const holderName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.username ||
    session.email ||
    "SiteCommand Trainee";

  // Keep an existing code stable across re-issues.
  const { data: existing } = await supabase
    .from("training_credentials")
    .select("code")
    .eq("user_id", session.id)
    .maybeSingle();
  const code = existing?.code ?? generateCode();

  const snapshot = {
    skills: profile.skills.map((s) => ({
      key: s.key,
      label: s.label,
      score: s.score,
      level: s.level,
      evidence: s.evidence.slice(0, 5),
    })),
    stats: profile.stats,
  };

  const { data: credential, error } = await supabase
    .from("training_credentials")
    .upsert(
      {
        user_id: session.id,
        code,
        holder_name: holderName,
        overall_level: profile.overall.level ?? "",
        overall_score: profile.overall.score ?? 0,
        profile: snapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("code, holder_name, title, overall_level, overall_score, issued_at, updated_at")
    .single();

  if (error || !credential) {
    return NextResponse.json(
      { error: error?.message || "Failed to issue credential" },
      { status: 500 },
    );
  }
  return NextResponse.json({ credential });
}
