/**
 * Coach narration scripts for "SiteCommand Training" sandboxes.
 *
 * The training Coach (app/projects/[id]/components/TrainingCoach.tsx — a
 * collapsible section embedded in the Day panel) surfaces a "message from your
 * coach" as text on each scheduled in-sim day. This module is the single
 * source of truth for what the coach says: a full welcome monologue on day
 * one, then a short phase-aware briefing for every subsequent scheduled day.
 *
 * It is client-safe (no server-only imports); the narration API route
 * (app/api/projects/[id]/training/narration/route.ts) calls it server-side to
 * personalize the text with the trainee's name and project, and the Coach
 * component renders the result verbatim.
 */

import type { SimRole } from "@/lib/simulation-constants";
import { getTrainingSchedule, resolveDayIndex } from "@/lib/training-schedule";
import {
  HEALTHCARE_TYPE,
  HC_WELCOME_ADDENDUM,
  healthcareDayBriefing,
} from "@/lib/training-healthcare";

export type TrainingNarration = {
  /** Short heading shown on the coach popup / modal (e.g. "Week 2 — Buyout"). */
  title: string;
  /** The message body, shown verbatim as the coach's text. */
  text: string;
};

/** First word of a full name, falling back to a friendly default. */
function firstNameOf(userName: string | null | undefined): string {
  const n = (userName ?? "").trim().split(/\s+/)[0];
  return n || "there";
}

/**
 * A display-friendly project name for narration. Generic sandbox names are
 * "Training: <Type>"; strip the prefix so the coach says "the Multifamily
 * Residential project", not "the Training: Multifamily Residential project".
 */
function cleanProjectName(projectName: string | null | undefined): string {
  const n = (projectName ?? "").trim();
  if (!n) return "this";
  return n.replace(/^training:\s*/i, "").trim() || "this";
}

/**
 * The day-one welcome — the coach orients the trainee to the simulation, the
 * "no safety net" reality, and the project network they'll hear from. Faithful
 * to the program script, with the trainee's name and project filled in.
 */
function welcomeScript(firstName: string, project: string): string {
  return [
    `Hi ${firstName}, thank you for taking the lead on the ${project} initiative.`,
    `Throughout this simulation, you'll be stepping directly into the shoes of the Project Manager. This program was engineered specifically for rising PMs to experience the high-stakes, fast-paced reality of managing a commercial project from groundbreaking to closeout.`,
    `Along the way, you'll be equipped with core project management lessons, technical insights, and standard operating procedures. Immediately following these lessons, you'll be prompted with real-world tasks, field conflicts, and documentation requests. Pay close attention to every piece of new information you receive — it will be directly pertinent to the critical decisions you have to make next.`,
    `Now, the reality of the field. To make this experience as realistic as possible, there is no safety net. In the field, mistakes don't always trigger an immediate warning. If you miss a critical submittal, overlook a long-lead item, or mismanage a coordination clash, the simulation will not stop you. Instead, those oversights will quietly compound, reflecting realistically in your project schedule and your bottom-line budget.`,
    `However, you won't be left completely in the dark. At major milestones, we'll hold formal Project Reviews. During these reviews, any missed items or budget variances will be laid out on the table so you can pivot, make adjustments, and find a way to get this project across the finish line.`,
    `A word on your project network. Construction is a team sport, and throughout this project you'll be receiving constant, realistic feedback from your team. Your Project Executive will keep a close eye on your financial health, owner relations, and contract compliance. Your Senior Superintendent will feed you real-time updates on site conditions, labor productivity, and subcontractor dynamics from the dirt. And your subcontractors and design team will push back on RFIs, change orders, and material delays.`,
    `Listen to your team, analyze your project data, and trust your training. Logistics, safety, and profitability are in your hands now. Let's get to work.`,
  ].join("\n\n");
}

/**
 * Hand-authored coach briefings for each scheduled Project Manager day after
 * day one. Keyed by the in-sim day number from lib/training-schedule.ts. Days
 * without an entry fall back to a schedule-derived briefing (see below).
 */
function authoredDayBriefing(day: number, firstName: string): string | null {
  switch (day) {
    case 2:
      return `Good to have you back, ${firstName}. You're still in buyout, and this is where margin is won or lost. Level your bids trade by trade and scope-check every number before you trust it — the low bid is rarely apples to apples. Most importantly, get your long-lead items identified now: switchgear, elevators, windows, rooftop units, generators. If you don't lock procurement on those this week, they'll set your finish date, not you. Issue your letters of intent to the long-lead trades so pricing holds and submittals can start.`;
    case 3:
      return `This week you start putting subcontracts on paper — foundations, structure, and underground utilities first, because they hit the field first. While you're awarding, build your submittal register straight off the spec sections and sit down with the architect and engineers to agree on turnaround times. Stand up your prime Schedule of Values and request sub SOVs. And don't let compliance slide: collect COIs, bonds, and W-9s before anyone mobilizes.`;
    case 4:
      return `Keep the awards moving, ${firstName} — sitework, concrete, plumbing, electrical, mechanical. Your first submittals are coming in for the early trades, so route rebar, mix designs, and anchor bolts fast; the foundation crew is waiting on them. Stay on top of the AHJ for your building, grading, and utility permits. A permit that isn't in hand is a start date you don't control.`;
    case 5:
      return `Boots on the ground this week. Mobilize the site — field office, fencing, erosion control, staging and laydown. Run your preconstruction kickoff with the owner, architect, engineers, and key subs so everyone's reading from the same set. And confirm utility coordination — power, water, sewer, gas, telecom — because a missed utility tie-in stalls everything downstream.`;
    case 6:
      return `Time to baseline the schedule. Sit with your superintendent, build the CPM, and distribute it to the subs — that schedule is your contract with the field. Get your first pay application in so cash flow starts on the right foot, push your envelope submittals since those are long-lead, and run your first owner-architect-contractor meeting. Lock in your QA/QC plan and mockup requirements now, before the work outruns them.`;
    case 7:
      return `Last week of preconstruction, ${firstName}. The goal is simple: be ninety to a hundred percent bought out before the structure goes vertical. Any scope you haven't awarded is exposure you carry. Set your standing cadence too — a weekly sub coordination meeting and a rolling three-week look-ahead. Get those rhythms in place and the build phase runs itself.`;
    case 10:
      return `Buyout wrap-up, ${firstName} — and this is the compliance day most PMs skip. Before a single sub mobilizes, verify their paper: current insurance certificates with the right additional-insured endorsements, bonds, W-9s. An expired COI on an active sub is a lawsuit waiting for an accident. Finish the submittal register, lock your site logistics plan, stand up your change-management process, and build the inspection matrix off your permit conditions — the special inspections your permit requires are not optional, and the city checks.`;
    case 14:
      return `You're out of the office and into the ground. This phase is foundations and site utilities — storm, sanitary, water, dry utilities, then footings, walls, and waterproofing. The decision that bites people here is the under-slab inspection: get MEP rough-in coordinated and signed off before anything gets buried, because you only pour over it once. Stay on your concrete testing and special inspections, and keep expediting those long-lead approvals.`;
    case 21:
      return `Still in the ground, ${firstName}, and this stretch is about closing loops. Every underground inspection gets signed off before backfill — no exceptions, because digging it back up costs ten times what waiting for the inspector did. When a test fails — compaction, concrete breaks — don't file it and hope; track it to a resolution with the engineer of record, and keep loading decisions conservative until the numbers prove out. Reconcile your buyout against the budget now that the early awards are in, and get your first monthly owner report out: schedule, cost, risks, photos. Owners forgive bad news; they don't forgive surprises.`;
    case 28:
      return `Now you go vertical. Structure and framing rise floor by floor, and the name of the game is sequencing — MEP rough-in has to chase the framing cleanly, top down per floor. Keep your shear-wall and structural inspections current so you're never covering work that hasn't been signed off. Push your interior finish submittals through now; they're long-lead, and a late selection here shows up as a stall months from now. Watch your coordination clashes and turn RFIs around fast.`;
    case 35:
      return `Mid-structure check, ${firstName}. Three disciplines keep this phase honest. First: nothing gets covered without its inspection sign-off on file — audit it floor by floor, because one buried miss becomes a tear-out. Second: your schedule update needs actuals, not optimism — find the float erosion now and work the recovery while it's cheap. Third: read the sub pay apps against what's actually installed; front-loaded billing is how you end up funding a sub's other job. And run your clash coordination ahead of every floor's rough-in, not behind it.`;
    case 42:
      return `Envelope and rough-in. Getting the building dried in — roofing, windows, doors, flashing, sealants — protects everything you install after it, so treat dry-in as a milestone, not an afterthought. Complete and inspect MEP rough-in, then insulation, then drywall, in that order. This is also when you onboard your commissioning agent and issue the Cx plan. And keep one eye on allowances and finish change orders against the budget — that's where the bottom line drifts.`;
    case 49:
      return `Verification week, ${firstName}. Don't declare dry-in — prove it, area by area: roofing complete, windows flashed, water testing passed. Close every above-ceiling inspection before the ceilings close, because fire and smoke sealing is the classic thing that gets covered and caught later. Sit with the Cx agent and finalize the commissioning plan and pre-functional checklists. Reforecast your cost at completion honestly — contingency burn hides until it doesn't. And confirm your energization prerequisites with the utility now; the meter set always takes longer than anyone believes. Start collecting closeout documents this early too — as-builts and O&Ms chased in the last month are the worst weeks of a PM's life.`;
    case 56:
      return `Interior finishes — this is where the owner finally sees their building. Paint, flooring, trim, casework, then MEP trim-out and equipment start-up. Get the elevator finished and through its state inspection; it's almost always on the critical path to occupancy. Drive a unit-by-unit completion tracker so nothing hides, finish fire and life-safety testing with the AHJ, and keep commissioning moving. Manage retention tightly and keep your pay apps and forecast honest.`;
    case 63:
      return `The pre-closeout push, ${firstName}. Run your own pre-punch area by area as finishes complete — every item you catch is one the owner's walk doesn't. Sequence the life-safety acceptance testing with the fire marshal now: pre-test the alarm system to one hundred percent, get the radio-coverage results in hand, and lock the test date, because the AHJ's calendar doesn't care about your occupancy date. Verify the elevator inspection is booked with its prerequisites done. Then clean house commercially: convert or close every open potential change with the owner, and put a real retainage plan on paper. A clean log now is a fast final payment later.`;
    case 70:
      return `Home stretch, ${firstName} — site completion, commissioning, and closeout. Wrap the sitework and landscaping, finish functional performance testing, and run your own self-punch before the owner and architect ever walk it. Coordinate final inspections and secure your Certificate of Occupancy — that's the finish line. Then close it out the right way: O&M manuals, as-builts, warranties, owner training, final pay applications, retention release, and a clean cost reconciliation. Finish strong.`;
    case 77:
      return `Last day on the job, ${firstName}. Everything now is about leaving clean: the complete closeout package accepted by the owner and architect, the final punch back-checked to zero, final billing processed — retainage released, final lien waivers collected, consent of surety in hand. Close every subcontract with its final waiver and warranty letter, hand the warranty program to the owner with the eleven-month walk already on the calendar, and sit the team down for an honest lessons-learned. The projects you're proudest of aren't the ones that went smoothly — they're the ones you closed out so well nobody ever had to call you about them again. Congratulations. Go get the next one.`;
    default:
      return null;
  }
}

/** Schedule-derived fallback for any PM day without an authored briefing. */
function fallbackDayBriefing(day: number, firstName: string): string {
  const schedule = getTrainingSchedule("project_manager");
  const idx = resolveDayIndex(schedule, day);
  if (idx < 0) {
    return `Welcome back, ${firstName}. Review where the project stands, work your open items, and keep the schedule and budget moving.`;
  }
  const entry = schedule[idx];
  const headlines = entry.tasks.slice(0, 2).map((t) => t.task.replace(/\.$/, ""));
  const focus = headlines.length
    ? ` Top of the list: ${headlines.join("; and ")}.`
    : "";
  return `Welcome to ${entry.timeframe}, ${firstName}. You're into ${entry.phase}.${focus} Keep your logs current, stay ahead of the long-lead items, and don't let a missed submittal or inspection compound on you.`;
}

/**
 * Builds the coach narration for a given role + in-sim day. Returns null for
 * roles without a narrated schedule (only Project Manager is wired up today,
 * matching the seeded schedule). The `day` may be a raw `training_day` value; it
 * is resolved to the active scheduled day before the script is chosen.
 */
export function buildTrainingNarration(
  role: SimRole,
  day: number,
  opts: { userName?: string | null; projectName?: string | null; projectType?: string | null },
): TrainingNarration | null {
  if (role !== "project_manager") return null;

  const schedule = getTrainingSchedule(role);
  if (schedule.length === 0) return null;

  const idx = resolveDayIndex(schedule, day);
  const entry = idx >= 0 ? schedule[idx] : schedule[0];
  const scheduledDay = entry.day;

  const firstName = firstNameOf(opts.userName);
  const project = cleanProjectName(opts.projectName);
  const isHealthcare = opts.projectType === HEALTHCARE_TYPE;

  // Day one is the full welcome; it doubles as the project's opening orientation.
  // Healthcare (VA) sandboxes append the federal / hospital orientation and use
  // the VA-flavored per-day briefings.
  const isFirstDay = scheduledDay === schedule[0].day;
  const text = isFirstDay
    ? isHealthcare
      ? `${welcomeScript(firstName, project)}\n\n${HC_WELCOME_ADDENDUM}`
      : welcomeScript(firstName, project)
    : (isHealthcare ? healthcareDayBriefing(scheduledDay, firstName) : null) ??
      authoredDayBriefing(scheduledDay, firstName) ??
      fallbackDayBriefing(scheduledDay, firstName);

  const title = isFirstDay
    ? "Welcome to the project"
    : `${entry.timeframe} — ${entry.phase}`;

  return { title, text };
}
