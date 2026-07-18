/**
 * The competency profile — rolls every graded training signal into a
 * per-skill picture of how the trainee actually performs:
 *
 *   - SCENARIOS (weight 0.40) — planted inbox decisions, handled/missed
 *     (training_scenario_outcomes). The strongest signal: real behavior.
 *   - MEETING CHECKPOINTS (0.25) — hidden tests caught in interactive
 *     meetings (training_meeting_minutes.checkpoints).
 *   - MODULE QUIZZES (0.20) — knowledge checks (training_lesson_quiz_results),
 *     routed to skills via the lesson's track/category.
 *   - PHASE REVIEWS (0.15) — task completion per phase Job Review
 *     (training_phase_reviews), routed via the phase.
 *
 * Weights renormalize over the components a skill actually has signal for.
 * The profile is user-level: evidence aggregates across every sandbox the
 * user has launched (including archived ones — earned evidence persists).
 *
 * Server-only (queries Supabase). The taxonomy/mappers live client-safe in
 * lib/training-skills.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { LESSONS } from "@/lib/training-lessons";
import { getTrainingScenario, TRAINING_SCENARIOS } from "@/lib/training-scenarios";
import {
  SKILLS,
  checkpointSkill,
  lessonSkill,
  phaseSkill,
  skillLevel,
  type SkillKey,
} from "@/lib/training-skills";

export type SkillComponent = { score: number; count: number };

export type SkillScore = {
  key: SkillKey;
  label: string;
  description: string;
  /** 0-100, or null when the skill has no signal yet. */
  score: number | null;
  level: string | null;
  components: {
    scenarios: SkillComponent | null;
    checkpoints: SkillComponent | null;
    quizzes: SkillComponent | null;
    phases: SkillComponent | null;
  };
  evidence: string[];
};

export type CompetencyStats = {
  modulesQuizzed: number;
  quizAverage: number | null;
  checkpointsCaught: number;
  checkpointsTotal: number;
  /** Site-walk Q&A points earned (full = 1, half = 0.5) across all meetings. */
  walkPoints: number;
  walkTotal: number;
  scenariosHandled: number;
  scenariosEvaluated: number;
  scenariosPlanted: number;
  phaseReviews: number;
  sandboxes: number;
};

export type EligibilityRule = { label: string; met: boolean };

export type CompetencyProfile = {
  skills: SkillScore[];
  overall: { score: number | null; level: string | null };
  stats: CompetencyStats;
  eligibility: { eligible: boolean; rules: EligibilityRule[] };
};

const WEIGHTS = { scenarios: 0.4, checkpoints: 0.25, quizzes: 0.2, phases: 0.15 };

type Acc = { sum: number; count: number };
const newAcc = (): Acc => ({ sum: 0, count: 0 });

export async function computeCompetencyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CompetencyProfile> {
  // Every sandbox this user launched — archived included, evidence persists.
  const { data: sandboxRows } = await supabase
    .from("projects")
    .select("id")
    .eq("is_training", true)
    .eq("training_owner_id", userId);
  const sandboxIds = ((sandboxRows ?? []) as { id: string }[]).map((r) => r.id);

  const quizAcc = new Map<SkillKey, Acc>();
  const checkpointAcc = new Map<SkillKey, Acc>();
  const scenarioAcc = new Map<SkillKey, Acc>();
  const phaseAcc = new Map<SkillKey, Acc>();
  const evidence = new Map<SkillKey, string[]>();
  const addEvidence = (skill: SkillKey, line: string) => {
    const list = evidence.get(skill) ?? [];
    if (list.length < 8) list.push(line);
    evidence.set(skill, list);
  };

  // ── Quizzes (user-level) ──
  const { data: quizRows } = await supabase
    .from("training_lesson_quiz_results")
    .select("lesson_id, best_score, total")
    .eq("user_id", userId);
  const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
  let quizPctSum = 0;
  let quizCount = 0;
  for (const row of (quizRows ?? []) as { lesson_id: string; best_score: number; total: number }[]) {
    const lesson = lessonById.get(row.lesson_id);
    if (!lesson || !row.total) continue;
    const pct = (row.best_score / row.total) * 100;
    const skill = lessonSkill(lesson);
    const acc = quizAcc.get(skill) ?? newAcc();
    acc.sum += pct;
    acc.count += 1;
    quizAcc.set(skill, acc);
    quizPctSum += pct;
    quizCount += 1;
  }
  for (const [skill, acc] of quizAcc) {
    addEvidence(skill, `Quiz average ${Math.round(acc.sum / acc.count)}% across ${acc.count} module${acc.count === 1 ? "" : "s"}`);
  }

  // ── Meeting checkpoints + scenarios + phase reviews (sandbox-level) ──
  let checkpointsCaught = 0;
  let checkpointsTotal = 0;
  let walkPoints = 0;
  let walkTotal = 0;
  let scenariosHandled = 0;
  let scenariosEvaluated = 0;
  let phaseReviews = 0;

  const isSkillKey = (v: unknown): v is SkillKey => SKILLS.some((s) => s.key === v);

  if (sandboxIds.length > 0) {
    const { data: minuteRows } = await supabase
      .from("training_meeting_minutes")
      .select("checkpoints, walk_results")
      .in("project_id", sandboxIds);
    for (const row of (minuteRows ?? []) as { checkpoints: unknown; walk_results?: unknown }[]) {
      const checkpoints = Array.isArray(row.checkpoints)
        ? (row.checkpoints as { id?: string; title?: string; caught?: boolean }[])
        : [];
      for (const c of checkpoints) {
        if (!c?.id) continue;
        const skill = checkpointSkill(c.id);
        const acc = checkpointAcc.get(skill) ?? newAcc();
        acc.sum += c.caught ? 100 : 0;
        acc.count += 1;
        checkpointAcc.set(skill, acc);
        checkpointsTotal += 1;
        if (c.caught) checkpointsCaught += 1;
        addEvidence(skill, `${c.caught ? "✓ Caught" : "✗ Missed"} in meeting: ${c.title ?? c.id}`);
      }

      // Timed site-walk Q&A (OAC meetings): full = 100, half = 50, none = 0,
      // routed by the skill stored on each result. Rolls into the same
      // meeting-performance component as checkpoints.
      const walkResults = Array.isArray(row.walk_results)
        ? (row.walk_results as { id?: string; title?: string; credit?: string; skill?: unknown }[])
        : [];
      for (const w of walkResults) {
        if (!w?.id || !w.credit) continue;
        const skill = isSkillKey(w.skill) ? w.skill : "comms";
        const score = w.credit === "full" ? 100 : w.credit === "half" ? 50 : 0;
        const acc = checkpointAcc.get(skill) ?? newAcc();
        acc.sum += score;
        acc.count += 1;
        checkpointAcc.set(skill, acc);
        walkTotal += 1;
        walkPoints += w.credit === "full" ? 1 : w.credit === "half" ? 0.5 : 0;
        const mark = w.credit === "full" ? "✓" : w.credit === "half" ? "◐ Half credit" : "✗ Missed";
        addEvidence(skill, `${mark} on the OAC site walk: ${w.title ?? w.id}`);
      }
    }

    const { data: scenarioRows } = await supabase
      .from("training_scenario_outcomes")
      .select("scenario_id, status, note")
      .in("project_id", sandboxIds);
    for (const row of (scenarioRows ?? []) as { scenario_id: string; status: string; note: string }[]) {
      const scenario = getTrainingScenario(row.scenario_id);
      if (!scenario) continue;
      const handled = row.status === "handled";
      const acc = scenarioAcc.get(scenario.skill) ?? newAcc();
      acc.sum += handled ? 100 : 0;
      acc.count += 1;
      scenarioAcc.set(scenario.skill, acc);
      scenariosEvaluated += 1;
      if (handled) scenariosHandled += 1;
      addEvidence(scenario.skill, `${handled ? "✓" : "✗"} ${scenario.title}${row.note ? ` — ${row.note}` : ""}`);
    }

    const { data: reviewRows } = await supabase
      .from("training_phase_reviews")
      .select("phase, completed, missed")
      .in("project_id", sandboxIds);
    for (const row of (reviewRows ?? []) as { phase: string; completed: unknown; missed: unknown }[]) {
      const done = Array.isArray(row.completed) ? row.completed.length : 0;
      const missed = Array.isArray(row.missed) ? row.missed.length : 0;
      const total = done + missed;
      if (total === 0) continue;
      const skill = phaseSkill(row.phase);
      const acc = phaseAcc.get(skill) ?? newAcc();
      acc.sum += (done / total) * 100;
      acc.count += 1;
      phaseAcc.set(skill, acc);
      phaseReviews += 1;
      addEvidence(skill, `Completed ${done}/${total} scheduled tasks in "${row.phase}"`);
    }
  }

  // ── Blend per skill ──
  const componentOf = (map: Map<SkillKey, Acc>, key: SkillKey): SkillComponent | null => {
    const acc = map.get(key);
    if (!acc || acc.count === 0) return null;
    return { score: Math.round(acc.sum / acc.count), count: acc.count };
  };

  const skills: SkillScore[] = SKILLS.map((def) => {
    const components = {
      scenarios: componentOf(scenarioAcc, def.key),
      checkpoints: componentOf(checkpointAcc, def.key),
      quizzes: componentOf(quizAcc, def.key),
      phases: componentOf(phaseAcc, def.key),
    };
    let weighted = 0;
    let weightSum = 0;
    for (const name of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
      const component = components[name];
      if (component) {
        weighted += component.score * WEIGHTS[name];
        weightSum += WEIGHTS[name];
      }
    }
    const score = weightSum > 0 ? Math.round(weighted / weightSum) : null;
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      score,
      level: score === null ? null : skillLevel(score),
      components,
      evidence: evidence.get(def.key) ?? [],
    };
  });

  const scored = skills.filter((s) => s.score !== null) as (SkillScore & { score: number })[];
  const overallScore =
    scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length) : null;

  const stats: CompetencyStats = {
    modulesQuizzed: quizCount,
    quizAverage: quizCount > 0 ? Math.round(quizPctSum / quizCount) : null,
    checkpointsCaught,
    checkpointsTotal,
    walkPoints,
    walkTotal,
    scenariosHandled,
    scenariosEvaluated,
    scenariosPlanted: TRAINING_SCENARIOS.length,
    phaseReviews,
    sandboxes: sandboxIds.length,
  };

  const rules: EligibilityRule[] = [
    { label: "Pass quizzes on at least 8 training modules", met: quizCount >= 8 },
    { label: "Complete at least one interactive meeting", met: checkpointsTotal > 0 },
    { label: "Have at least 3 sandbox scenarios graded", met: scenariosEvaluated >= 3 },
    { label: "Complete at least one phase Job Review", met: phaseReviews >= 1 },
    { label: "Reach an overall score of 60 or higher", met: (overallScore ?? 0) >= 60 },
  ];

  return {
    skills,
    overall: {
      score: overallScore,
      level: overallScore === null ? null : skillLevel(overallScore),
    },
    stats,
    eligibility: { eligible: rules.every((r) => r.met), rules },
  };
}
