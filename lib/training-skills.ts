/**
 * Skill taxonomy for the training "competency spine".
 *
 * Every graded signal in the training program — module quiz results, meeting
 * checkpoint catches, scenario outcomes (planted inbox decisions), and phase
 * Job Review completion — maps onto one of six PM skill areas. The mappers
 * here are the single source of truth for that routing; the aggregation that
 * turns signals into a per-skill profile lives server-side in
 * lib/training-competency.ts.
 *
 * Client-safe: pure content + pure functions, no server imports.
 */

import type { Lesson } from "@/lib/training-lessons";

export type SkillKey = "buyout" | "cost" | "schedule" | "submittals" | "field" | "comms";

export type SkillDef = {
  key: SkillKey;
  label: string;
  description: string;
};

export const SKILLS: SkillDef[] = [
  {
    key: "buyout",
    label: "Buyout & Procurement",
    description: "Bid leveling, scope gaps, awarding subs, and locking pricing before it moves.",
  },
  {
    key: "cost",
    label: "Cost & Billing",
    description: "Invoice review, pay applications, lien waivers, retainage, and change costs.",
  },
  {
    key: "schedule",
    label: "Schedule & Long-Lead",
    description: "Sequencing, long-lead releases, milestone protection, and delay recovery.",
  },
  {
    key: "submittals",
    label: "RFIs & Submittals",
    description: "Document control — driving RFIs and submittals to answers before they block work.",
  },
  {
    key: "field",
    label: "Field Ops & Quality",
    description: "Inspections, testing failures, coordination holds, and quality decisions in the field.",
  },
  {
    key: "comms",
    label: "Owner Relations & Communication",
    description: "Responsiveness, meetings, and keeping the owner ahead of surprises.",
  },
];

export const SKILL_LABELS: Record<SkillKey, string> = Object.fromEntries(
  SKILLS.map((s) => [s.key, s.label]),
) as Record<SkillKey, string>;

/** Score (0-100) → named level. */
export function skillLevel(score: number): string {
  if (score >= 85) return "Advanced";
  if (score >= 65) return "Proficient";
  if (score >= 40) return "Competent";
  return "Developing";
}

/* ── Signal → skill routing ──────────────────────────────────────────── */

// Category/title keywords win over the track default so e.g. a "commercial"
// track lesson about lien waivers lands in Cost & Billing.
const LESSON_KEYWORD_RULES: { pattern: RegExp; skill: SkillKey }[] = [
  { pattern: /rfi|submittal|specification|spec book|drawing|document control|transmittal/i, skill: "submittals" },
  { pattern: /buyout|bid|procure|award|subcontract admin|delivery method|scope gap/i, skill: "buyout" },
  { pattern: /cost|billing|invoice|budget|payment|retainage|lien|financ|estimat|change order|change event|claim/i, skill: "cost" },
  { pattern: /schedul|long.?lead|sequence|delay|forecast|lookahead/i, skill: "schedule" },
  { pattern: /owner|communicat|meeting|leadership|ethic|negotiat/i, skill: "comms" },
];

const LESSON_TRACK_DEFAULT: Record<Lesson["track"], SkillKey> = {
  workflow: "submittals",
  concept: "field",
  technical: "field",
  sitework: "field",
  mep: "field",
  commercial: "cost",
  foundations: "comms",
  fieldops: "field",
};

export function lessonSkill(lesson: Pick<Lesson, "track" | "category" | "title">): SkillKey {
  const haystack = `${lesson.category} ${lesson.title}`;
  for (const rule of LESSON_KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) return rule.skill;
  }
  return LESSON_TRACK_DEFAULT[lesson.track] ?? "field";
}

/** Meeting checkpoint id → skill (default: buyout, meetings are buyout-heavy today). */
const CHECKPOINT_SKILLS: Record<string, SkillKey> = {
  "slab-milestone": "schedule",
  "steel-scope-gap": "buyout",
  "roofing-price-hold": "buyout",
  "switchgear-lead": "schedule",
  "glazing-risk": "buyout",
};

export function checkpointSkill(checkpointId: string): SkillKey {
  return CHECKPOINT_SKILLS[checkpointId] ?? "buyout";
}

/** Schedule phase → the skill its task completion evidences most directly. */
const PHASE_SKILLS: Record<string, SkillKey> = {
  "Pre-Construction & Buyout": "buyout",
  "Foundations & Site Utilities": "field",
  "Vertical Structure / Framing": "schedule",
  "Envelope / MEP Rough-In / Dry-In": "field",
  "Interior Finishes": "field",
  "Site Completion, Commissioning & Closeout": "cost",
};

export function phaseSkill(phase: string): SkillKey {
  return PHASE_SKILLS[phase] ?? "field";
}
