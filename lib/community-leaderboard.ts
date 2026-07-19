/**
 * Community leaderboard — ranks users by their SiteCommand training-simulation
 * performance. Derived entirely from the existing training tables (no new
 * storage), aggregated in bulk so it stays one pass regardless of user count:
 *
 *   • Quiz points        — correct answers banked across module quizzes
 *   • Scenarios handled   — planted inbox decisions handled in time
 *   • Checkpoints caught  — hidden meeting tests caught
 *   • Walk points         — timed site-walk Q&A credit (full = 1, half = 0.5)
 *   • Phase reviews       — milestone Job Reviews completed
 *   • Sandboxes           — training projects launched
 *
 * Those roll into a single `score`. Users with any signal are ranked highest
 * first. A user's issued credential (if any) rides along as a badge.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  score: number;
  quizPoints: number;
  scenariosHandled: number;
  checkpointsCaught: number;
  walkPoints: number;
  phaseReviews: number;
  sandboxes: number;
  credentialLevel: string | null;
  credentialCode: string | null;
};

// Point weights per signal. Quiz points are already raw counts of correct
// answers; the rest are milestone-style events worth more each.
const W = { quiz: 1, scenario: 12, checkpoint: 6, walk: 6, phase: 8, sandbox: 3 };

type Bucket = {
  quizPoints: number;
  scenariosHandled: number;
  checkpointsCaught: number;
  walkPoints: number;
  phaseReviews: number;
  sandboxes: number;
};

const empty = (): Bucket => ({
  quizPoints: 0,
  scenariosHandled: 0,
  checkpointsCaught: 0,
  walkPoints: 0,
  phaseReviews: 0,
  sandboxes: 0,
});

export async function computeLeaderboard(
  supabase: SupabaseClient,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const buckets = new Map<string, Bucket>();
  const bucket = (userId: string): Bucket => {
    let b = buckets.get(userId);
    if (!b) {
      b = empty();
      buckets.set(userId, b);
    }
    return b;
  };

  // Map every training sandbox → its owner (used to attribute sandbox-scoped
  // signals — meetings, scenarios, phase reviews — back to the trainee).
  const { data: sandboxes } = await supabase
    .from("projects")
    .select("id, training_owner_id")
    .eq("is_training", true);
  const projectOwner = new Map<string, string>();
  for (const p of (sandboxes ?? []) as { id: string; training_owner_id: string | null }[]) {
    if (!p.training_owner_id) continue;
    projectOwner.set(p.id, p.training_owner_id);
    bucket(p.training_owner_id).sandboxes += 1;
  }
  const sandboxIds = [...projectOwner.keys()];

  // Quizzes (user-level): banked correct answers.
  const { data: quizRows } = await supabase
    .from("training_lesson_quiz_results")
    .select("user_id, best_score");
  for (const r of (quizRows ?? []) as { user_id: string; best_score: number }[]) {
    if (!r.user_id) continue;
    bucket(r.user_id).quizPoints += Math.max(0, r.best_score || 0);
  }

  if (sandboxIds.length > 0) {
    // Scenario outcomes → owner.
    const { data: scenarioRows } = await supabase
      .from("training_scenario_outcomes")
      .select("project_id, status")
      .in("project_id", sandboxIds);
    for (const r of (scenarioRows ?? []) as { project_id: string; status: string }[]) {
      const owner = projectOwner.get(r.project_id);
      if (owner && r.status === "handled") bucket(owner).scenariosHandled += 1;
    }

    // Meeting checkpoints caught + site-walk Q&A credit → owner.
    const { data: minuteRows } = await supabase
      .from("training_meeting_minutes")
      .select("project_id, checkpoints, walk_results")
      .in("project_id", sandboxIds);
    for (const r of (minuteRows ?? []) as {
      project_id: string;
      checkpoints: unknown;
      walk_results?: unknown;
    }[]) {
      const owner = projectOwner.get(r.project_id);
      if (!owner) continue;
      const checkpoints = Array.isArray(r.checkpoints)
        ? (r.checkpoints as { caught?: boolean }[])
        : [];
      for (const c of checkpoints) if (c?.caught) bucket(owner).checkpointsCaught += 1;
      const walkResults = Array.isArray(r.walk_results)
        ? (r.walk_results as { credit?: string }[])
        : [];
      for (const w of walkResults) {
        if (w?.credit === "full") bucket(owner).walkPoints += 1;
        else if (w?.credit === "half") bucket(owner).walkPoints += 0.5;
      }
    }

    // Phase reviews → owner.
    const { data: phaseRows } = await supabase
      .from("training_phase_reviews")
      .select("project_id")
      .in("project_id", sandboxIds);
    for (const r of (phaseRows ?? []) as { project_id: string }[]) {
      const owner = projectOwner.get(r.project_id);
      if (owner) bucket(owner).phaseReviews += 1;
    }
  }

  // Names + credential badge.
  const userIds = [...buckets.keys()];
  const names = new Map<string, string>();
  const credentials = new Map<string, { level: string; code: string }>();
  if (userIds.length > 0) {
    const { data: userRows } = await supabase
      .from("users")
      .select("id, first_name, last_name, username")
      .in("id", userIds);
    for (const u of (userRows ?? []) as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      username: string | null;
    }[]) {
      const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
      names.set(u.id, full || u.username || "SiteCommand member");
    }
    const { data: credRows } = await supabase
      .from("training_credentials")
      .select("user_id, overall_level, code")
      .in("user_id", userIds);
    for (const c of (credRows ?? []) as {
      user_id: string;
      overall_level: string | null;
      code: string | null;
    }[]) {
      if (c.code) credentials.set(c.user_id, { level: c.overall_level || "Certified", code: c.code });
    }
  }

  const entries: LeaderboardEntry[] = userIds.map((userId) => {
    const b = buckets.get(userId)!;
    const score = Math.round(
      b.quizPoints * W.quiz +
        b.scenariosHandled * W.scenario +
        b.checkpointsCaught * W.checkpoint +
        b.walkPoints * W.walk +
        b.phaseReviews * W.phase +
        b.sandboxes * W.sandbox,
    );
    const cred = credentials.get(userId) ?? null;
    return {
      userId,
      name: names.get(userId) ?? "SiteCommand member",
      score,
      quizPoints: b.quizPoints,
      scenariosHandled: b.scenariosHandled,
      checkpointsCaught: b.checkpointsCaught,
      walkPoints: b.walkPoints,
      phaseReviews: b.phaseReviews,
      sandboxes: b.sandboxes,
      credentialLevel: cred?.level ?? null,
      credentialCode: cred?.code ?? null,
    };
  });

  return entries
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
