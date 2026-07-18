/**
 * Community → Leaderboard (simulation performance).
 *
 * GET /api/community/leaderboard — ranks users by their SiteCommand training
 *     simulation performance (quizzes + scenarios + meeting checkpoints +
 *     phase reviews + sandboxes launched). Also flags the caller's own rank.
 *     See lib/community-leaderboard.ts for the scoring.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { computeLeaderboard } from "@/lib/community-leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const entries = await computeLeaderboard(supabase, 50);

  const meIndex = entries.findIndex((e) => e.userId === session.id);
  const leaderboard = entries.map((e, i) => ({
    rank: i + 1,
    name: e.name,
    score: e.score,
    quizPoints: e.quizPoints,
    scenariosHandled: e.scenariosHandled,
    checkpointsCaught: e.checkpointsCaught,
    phaseReviews: e.phaseReviews,
    sandboxes: e.sandboxes,
    credentialLevel: e.credentialLevel,
    credentialCode: e.credentialCode,
    isMe: e.userId === session.id,
  }));

  return NextResponse.json({
    leaderboard,
    myRank: meIndex >= 0 ? meIndex + 1 : null,
  });
}
