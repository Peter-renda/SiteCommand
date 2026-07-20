/**
 * Planted decision scenarios for the PM training sandbox — the "competency
 * spine" content.
 *
 * The day-scheduled inbox feed (lib/training-inbox.ts) plants real decisions
 * in front of the trainee: a switchgear quote with a 30-day price hold, a
 * missing lien waiver holding a payment, an equipment-rental invoice with a
 * deliberate overbilling, failed compaction tests, an elevator fab-slot
 * deadline. Each scenario here closes the loop on one of those plants:
 *
 *   - EVALUATION — once `deadlineDay` passes, the trainee's actual behavior
 *     (their sent emails + created tasks) is judged as handled/missed
 *     (lib/training-scenario-eval.ts) and recorded to
 *     training_scenario_outcomes. Those outcomes feed the per-skill
 *     competency profile (lib/training-competency.ts).
 *
 *   - RIPPLE — decisions have consequences. A missed scenario delivers its
 *     `consequence` email into the sandbox inbox on `consequence.day` (the
 *     switchgear you never released shows up as a delivery slip weeks later);
 *     a handled scenario delivers its `confirmation` so good calls pay off
 *     visibly too.
 *
 * Client-safe: pure content. Server-side evaluation/delivery lives in
 * lib/training-scenario-eval.ts.
 */

import type { InboxCtx } from "@/lib/training-inbox";
import type { SkillKey } from "@/lib/training-skills";
import { HC_SCENARIOS, HEALTHCARE_TYPE } from "@/lib/training-healthcare";

export type ScenarioRipple = {
  /** In-sim day the ripple email lands (must be > deadlineDay). */
  day: number;
  /** INBOX_SENDERS key of the persona sending the ripple. */
  senderKey: string;
  subject: string;
  html: (ctx: InboxCtx) => string;
};

export type TrainingScenario = {
  id: string;
  skill: SkillKey;
  title: string;
  /** Day the decision was planted (the inbox email's scheduled day). */
  plantedDay: number;
  /** Day by which the trainee should have acted; evaluation runs after this. */
  deadlineDay: number;
  /** Canonical inbox thread slugs (training-inbox-{slug}) holding the plant. */
  threadSlugs: string[];
  /** Matches trainee emails/tasks that are plausibly about this scenario. */
  topics: RegExp;
  /** What good handling looks like — drives the judge and the UI. */
  expectation: string;
  /** Degraded-mode heuristic: handled if a trainee message hits one of these. */
  handledKeywords: string[];
  /** Delivered when the scenario was MISSED. */
  consequence?: ScenarioRipple;
  /** Delivered when the scenario was HANDLED. */
  confirmation?: ScenarioRipple;
};

/** Deterministic conversation id for ripple threads (idempotent delivery). */
export function scenarioConversationId(scenarioId: string, kind: "consequence" | "confirmation"): string {
  return `training-ripple-${scenarioId}-${kind === "consequence" ? "miss" : "ok"}`;
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  // ── Schedule & Long-Lead ────────────────────────────────────────────────
  {
    id: "switchgear-release",
    skill: "schedule",
    title: "Release the long-lead switchgear",
    plantedDay: 3,
    deadlineDay: 14,
    threadSlugs: ["vendor-switchgear-quote"],
    topics: /switchgear|gulf states|3000a|main switchboard|distribution panels|gear release/i,
    expectation:
      "Act on the 42-week lead time and 30-day price hold: commit to a PO/LOI or early release with the vendor (or escalate internally to get it released) before the pricing hold lapses.",
    handledKeywords: ["po", "purchase order", "loi", "release", "letter of intent", "proceed", "award"],
    consequence: {
      day: 42,
      senderKey: "switchgear_vendor",
      subject: "Pricing Expired + Production Slot Released — Switchgear Now 50+ Weeks",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I have to give you some bad news on the ${ctx.projectLabel} switchgear package. When our 30-day price hold lapsed without a PO or LOI, the factory released the production slot we were holding, and copper moved against us in the meantime:</p>

<ul>
  <li><strong>Repriced package: $674,100</strong> — an increase of roughly $48,800 over the proposal you had in hand.</li>
  <li><strong>New factory lead time: 50+ weeks</strong> from approved submittals. The next open slot puts delivery well past where your schedule needed gear on site.</li>
</ul>

<p>I flagged the math on this back in week one — the numbers only worked with a release inside the hold window. Options from here, none of them great: pay an expedite premium for a cancelled-order slot if one opens, or re-sequence energization around temporary power for longer than anyone wants.</p>

<p>Call me and let's salvage what we can.</p>

<p>Dana Whitcomb<br/>Regional Sales Manager, Gulf States Switchgear<br/>(678) 555-0322</p>
`.trim(),
    },
    confirmation: {
      day: 42,
      senderKey: "switchgear_vendor",
      subject: "Switchgear Order Confirmed — Production Slot Locked, Delivery Holds",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Good news worth putting in your monthly report: because you released the switchgear inside our price-hold window, the ${ctx.projectLabel} order is <strong>locked at the proposal price with a confirmed factory slot</strong>. Approval drawings are in the submittal cycle and the delivery date supports your energization sequence with margin to spare.</p>

<p>Lead times have stretched past 50 weeks for orders placed today, so that early release is quietly one of the better schedule decisions on this job.</p>

<p>Dana Whitcomb<br/>Regional Sales Manager, Gulf States Switchgear<br/>(678) 555-0322</p>
`.trim(),
    },
  },

  // ── Owner Relations & Communication ─────────────────────────────────────
  {
    id: "owner-ev-rom",
    skill: "comms",
    title: "Answer the owner's EV-charging ROM request",
    plantedDay: 15,
    deadlineDay: 22,
    threadSlugs: ["owner-ev-charging"],
    topics: /ev charg|charging station|level 2|rom|rough order/i,
    expectation:
      "Respond to Elaine within her two-week window: a ROM number (or a dated commitment to one), the schedule impact, the electrical-service flag, and log it as a potential change so it's tracked.",
    handledKeywords: ["rom", "rough order", "change event", "potential change", "schedule impact", "service sizing"],
    consequence: {
      day: 25,
      senderKey: "owner_rep",
      subject: "Went to Committee Without Your Number — We Need to Talk About Responsiveness",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I asked for a ROM on the EV charging scope with a two-week window and the board meeting came and went without a number from your team. I had to walk into committee with a placeholder I built myself from another project — which is not a position I ever want to be in with my investment committee, and frankly not one you want me in either.</p>

<p>Two things going forward:</p>
<ul>
  <li>If a date I give you is at risk, I need to hear it <em>before</em> the date, not after.</li>
  <li>The scope is still live. Get me the ROM this week, including whether it touches the electrical service — if it does and we find out after switchgear is locked, that's a much more expensive conversation.</li>
</ul>

<p>Elaine Whitfield<br/>Director of Development, Meridian Development Partners<br/>(404) 555-0410</p>
`.trim(),
    },
    confirmation: {
      day: 25,
      senderKey: "owner_rep",
      subject: "RE: EV Charging — Committee Green-Lit Formal Pricing",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Thanks for turning the EV ROM around inside my window — having a real number (and the service-capacity flag) in front of the committee is exactly what I needed. They've green-lit taking it to formal pricing, so expect a request for a hard proposal shortly. Keep it tracked as a potential change on your log.</p>

<p>This is what good looks like. Appreciate it.</p>

<p>Elaine Whitfield<br/>Director of Development, Meridian Development Partners<br/>(404) 555-0410</p>
`.trim(),
    },
  },

  // ── Field Ops & Quality ─────────────────────────────────────────────────
  {
    id: "failed-compaction",
    skill: "field",
    title: "Stop and fix the failed trench compaction",
    plantedDay: 19,
    deadlineDay: 26,
    threadSlugs: ["testing-failed-compaction"],
    topics: /compaction|density test|proctor|trench|backfill|re-?test/i,
    expectation:
      "Direct the fix: pull the covering lift, re-compact the failed lifts, retest lift-by-lift before covering, and get the sitework crew calling for tests before burying work — not after.",
    handledKeywords: ["retest", "re-test", "recompact", "re-compact", "pull the lift", "remove the lift", "hold", "lift by lift"],
    consequence: {
      day: 34,
      senderKey: "testing_agency",
      subject: "Settlement at Area B Trench Crossing — This Is Now an Excavation Project",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Following up on the failed density tests we flagged on the Area B sanitary trench — which were never re-tested. After this weekend's storm, our tech documented <strong>visible settlement along the trench line where it crosses the future drive aisle</strong>, roughly 2" at the worst spot. The curb subgrade above it has dropped with it.</p>

<p>Where that leaves you:</p>
<ul>
  <li>The trench run has to come open — excavate through the placed lifts, dry or replace the wet material, re-compact and <strong>pass lift-by-lift</strong> this time.</li>
  <li>Any subgrade prep done over it is lost work, and the paving sequence in that area needs to move.</li>
  <li>Had we re-tested when the failures were two lifts deep, this was a half-day fix. It is not a half-day fix anymore.</li>
</ul>

<p>We're staked and ready to test whenever the crew is — same-day service if you call by 2 PM.</p>

<p>Owen Blake<br/>Field Operations Manager, Meridian Testing Labs<br/>(770) 555-0429</p>
`.trim(),
    },
    confirmation: {
      day: 34,
      senderKey: "testing_agency",
      subject: "Area B Retests Passed — Trench Cleared Lift-by-Lift",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Closing the loop on the Area B sanitary trench: after your team pulled the covering lift and re-compacted, <strong>all retests passed — 96% to 98% against the 95% requirement, verified lift-by-lift</strong> through the remainder of the run. Reports are in today's transmittal.</p>

<p>For what it's worth, jumping on that when it was two lifts deep is why it stayed a half-day fix. The crews are now calling us before covering work, which is exactly the rhythm you want going into building utilities.</p>

<p>Owen Blake<br/>Field Operations Manager, Meridian Testing Labs<br/>(770) 555-0429</p>
`.trim(),
    },
  },
  {
    id: "sprinkler-early-start",
    skill: "field",
    title: "Hold the sprinkler sub to coordination sign-off",
    plantedDay: 40,
    deadlineDay: 45,
    threadSlugs: ["sub-sprinkler-early-start"],
    topics: /sprinkler|branch pipe|coordination|sign-?off|fire protection/i,
    expectation:
      "Tell the sprinkler sub no: branch pipe does not hang ahead of coordination sign-off, even under schedule pressure — rework from an uncoordinated ceiling costs more than the wait.",
    handledKeywords: ["hold off", "wait", "not until", "after sign-off", "after signoff", "coordination first", "no early"],
  },

  // ── Cost & Billing ──────────────────────────────────────────────────────
  {
    id: "lien-waiver-hold",
    skill: "cost",
    title: "Chase the missing Bedrock lien waiver",
    plantedDay: 31,
    deadlineDay: 40,
    threadSlugs: ["acct-missing-lien-waiver"],
    topics: /lien waiver|bedrock|conditional waiver|lower-?tier/i,
    expectation:
      "Chase Bedrock Concrete for the executed conditional waiver (and any lower-tier supplier waivers) so accounting can release the held payment — don't let it silently slip payment runs.",
    handledKeywords: ["waiver", "bedrock", "chase", "release the payment", "conditional"],
    consequence: {
      day: 47,
      senderKey: "accounting",
      subject: "Bedrock Filed a Notice of Intent to Lien — Owner's Title Company Is Asking",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The Bedrock situation went the way these always go when nobody chases the paperwork. Their payment has now slipped <strong>two runs</strong> waiting on the waiver nobody collected, their office manager stopped being polite about it, and yesterday they filed a <strong>notice of intent to lien</strong> to protect themselves.</p>

<p>That notice hit the owner's title company this morning, which means Elaine's office knows about it before you told her — the worst order of operations there is.</p>

<p>To unwind it I need, today if possible:</p>
<ul>
  <li>The executed conditional waiver for the prior month (and the rebar/pump supplier waivers if any).</li>
  <li>A call from you to Bedrock's office smoothing this over — I can release same-day once the paper lands.</li>
</ul>

<p>Janet</p>
`.trim(),
    },
    confirmation: {
      day: 47,
      senderKey: "accounting",
      subject: "Bedrock Waiver Received — Payment Released Same-Day",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Bedrock's executed conditional waiver (plus the rebar supplier's lower-tier waiver) landed after you chased their office — <strong>payment released same-day as promised</strong>. Their office manager mentioned you were the one who called; that kind of thing keeps subs answering the phone when we need a favor later.</p>

<p>Clean file, no lien exposure, no drama. Thank you.</p>

<p>Janet</p>
`.trim(),
    },
  },
  {
    id: "rental-overbilling",
    skill: "cost",
    title: "Dispute the equipment-rental overbilling",
    plantedDay: 44,
    deadlineDay: 52,
    threadSlugs: ["acct-invoice-rental-dispute"],
    topics: /rental|damage waiver|overbill|rate|credit memo|invoice/i,
    expectation:
      "Catch the errors instead of approving as-is: the billed rate exceeds the agreed rate and the damage-waiver charge shouldn't be there — dispute both and ask for a corrected invoice or credit memo.",
    handledKeywords: ["dispute", "credit", "wrong rate", "overbill", "damage waiver", "corrected invoice", "short pay"],
    consequence: {
      day: 54,
      senderKey: "accounting",
      subject: "Rental Invoice Paid As Billed — Overcharges Are Now Job Cost",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The equipment-rental invoice cleared this week's run with no dispute on file, so it <strong>paid as billed</strong> — including the rate that didn't match the agreed schedule and the damage-waiver charges we're insured against. I flagged both when I sent it over; approval means I pay it.</p>

<p>I went back to the vendor about a credit and got the answer you'd expect: <em>"the invoice was approved."</em> Recovering money after payment is ten times harder than short-paying a disputed line — we'll keep pushing, but plan on eating some of it as job cost.</p>

<p>Going forward, please treat every invoice I route as a review, not a rubber stamp. The ones I flag especially.</p>

<p>Janet</p>
`.trim(),
    },
    confirmation: {
      day: 54,
      senderKey: "accounting",
      subject: "Rental Credit Memo In — Corrected Invoice Paid",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Nice catch on the rental invoice. The vendor issued a <strong>credit memo for the rate difference and pulled the damage-waiver charges</strong> once you disputed them in writing — corrected invoice paid in this week's run. That's real money that stays in the job instead of leaking out through sloppy billing.</p>

<p>I wish every PM read the flagged ones that closely.</p>

<p>Janet</p>
`.trim(),
    },
  },
  {
    id: "mech-overbilling",
    skill: "cost",
    title: "Cut the mechanical sub's front-loaded billing",
    plantedDay: 46,
    deadlineDay: 52,
    threadSlugs: ["acct-mech-overbilling"],
    topics: /pencil|overbill|ductwork|stored material|percent complete|pay app|billed/i,
    expectation:
      "Adjust the pencil draw to installed reality: the mechanical sub billed ~80% on ductwork that's ~55% installed — cut the line to earned value (plus properly documented stored material) before it certifies.",
    handledKeywords: ["cut", "reduce", "pencil", "installed", "earned", "stored material", "adjust"],
  },

  // ── Cross-category competency checks (paired with training-inbox emails) ──
  {
    id: "competency-contract-admin-a",
    skill: "comms",
    title: "Contract Administration: identify and plan",
    plantedDay: 6,
    deadlineDay: 11,
    threadSlugs: ["competency-contract-admin-a"],
    topics: /contract|notice|insurance|bond|subcontract|general conditions|payment terms|claim/i,
    expectation:
      "The trainee should address the contract administration prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['notice', 'insurance', 'bond', 'risk', 'subcontract', 'payment'],
  },
  {
    id: "competency-contract-admin-b",
    skill: "comms",
    title: "Contract Administration: execute and document",
    plantedDay: 7,
    deadlineDay: 12,
    threadSlugs: ["competency-contract-admin-b"],
    topics: /contract|notice|insurance|bond|subcontract|general conditions|payment terms|claim/i,
    expectation:
      "The trainee should address the contract administration prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['notice', 'insurance', 'bond', 'risk', 'subcontract', 'payment'],
  },
  {
    id: "competency-cost-management-a",
    skill: "cost",
    title: "Cost Management: identify and plan",
    plantedDay: 9,
    deadlineDay: 14,
    threadSlugs: ["competency-cost-management-a"],
    topics: /budget|cost code|committed|forecast|eac|variance|contingency|allowance|cash flow/i,
    expectation:
      "The trainee should address the cost management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['eac', 'forecast', 'variance', 'contingency', 'allowance', 'cash flow'],
  },
  {
    id: "competency-cost-management-b",
    skill: "cost",
    title: "Cost Management: execute and document",
    plantedDay: 10,
    deadlineDay: 15,
    threadSlugs: ["competency-cost-management-b"],
    topics: /budget|cost code|committed|forecast|eac|variance|contingency|allowance|cash flow/i,
    expectation:
      "The trainee should address the cost management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['eac', 'forecast', 'variance', 'contingency', 'allowance', 'cash flow'],
  },
  {
    id: "competency-estimating-buyout-a",
    skill: "buyout",
    title: "Estimating / Buyout: identify and plan",
    plantedDay: 12,
    deadlineDay: 17,
    threadSlugs: ["competency-estimating-buyout-a"],
    topics: /bid|level|takeoff|scope gap|award|value engineer|estimate|buyout/i,
    expectation:
      "The trainee should address the estimating / buyout prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['level', 'scope gap', 'award', 'exclude', 'alternate', 'takeoff'],
  },
  {
    id: "competency-estimating-buyout-b",
    skill: "buyout",
    title: "Estimating / Buyout: execute and document",
    plantedDay: 13,
    deadlineDay: 18,
    threadSlugs: ["competency-estimating-buyout-b"],
    topics: /bid|level|takeoff|scope gap|award|value engineer|estimate|buyout/i,
    expectation:
      "The trainee should address the estimating / buyout prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['level', 'scope gap', 'award', 'exclude', 'alternate', 'takeoff'],
  },
  {
    id: "competency-scheduling-a",
    skill: "schedule",
    title: "Scheduling: identify and plan",
    plantedDay: 15,
    deadlineDay: 20,
    threadSlugs: ["competency-scheduling-a"],
    topics: /schedule|critical path|look.?ahead|milestone|recovery|sequence|delay/i,
    expectation:
      "The trainee should address the scheduling prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['critical path', 'lookahead', 'look-ahead', 'recovery', 'resequenc', 'milestone'],
  },
  {
    id: "competency-scheduling-b",
    skill: "schedule",
    title: "Scheduling: execute and document",
    plantedDay: 16,
    deadlineDay: 21,
    threadSlugs: ["competency-scheduling-b"],
    topics: /schedule|critical path|look.?ahead|milestone|recovery|sequence|delay/i,
    expectation:
      "The trainee should address the scheduling prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['critical path', 'lookahead', 'look-ahead', 'recovery', 'resequenc', 'milestone'],
  },
  {
    id: "competency-procurement-a",
    skill: "schedule",
    title: "Procurement: identify and plan",
    plantedDay: 18,
    deadlineDay: 23,
    threadSlugs: ["competency-procurement-a"],
    topics: /procurement|long.?lead|release|fabrication|delivery|owner furnished|ofci/i,
    expectation:
      "The trainee should address the procurement prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['procurement', 'long-lead', 'long lead', 'release', 'fabrication', 'delivery'],
  },
  {
    id: "competency-procurement-b",
    skill: "schedule",
    title: "Procurement: execute and document",
    plantedDay: 19,
    deadlineDay: 24,
    threadSlugs: ["competency-procurement-b"],
    topics: /procurement|long.?lead|release|fabrication|delivery|owner furnished|ofci/i,
    expectation:
      "The trainee should address the procurement prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['procurement', 'long-lead', 'long lead', 'release', 'fabrication', 'delivery'],
  },
  {
    id: "competency-submittals-a",
    skill: "submittals",
    title: "Submittals: identify and plan",
    plantedDay: 21,
    deadlineDay: 26,
    threadSlugs: ["competency-submittals-a"],
    topics: /submittal|resubmittal|architect review|approval status|overdue/i,
    expectation:
      "The trainee should address the submittals prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['submittal', 'resubmit', 'overdue', 'approval', 'log', 'expedite'],
  },
  {
    id: "competency-submittals-b",
    skill: "submittals",
    title: "Submittals: execute and document",
    plantedDay: 22,
    deadlineDay: 27,
    threadSlugs: ["competency-submittals-b"],
    topics: /submittal|resubmittal|architect review|approval status|overdue/i,
    expectation:
      "The trainee should address the submittals prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['submittal', 'resubmit', 'overdue', 'approval', 'log', 'expedite'],
  },
  {
    id: "competency-rfis-a",
    skill: "submittals",
    title: "RFIs: identify and plan",
    plantedDay: 24,
    deadlineDay: 29,
    threadSlugs: ["competency-rfis-a"],
    topics: /rfi|design conflict|consultant|response|field delay|distribute/i,
    expectation:
      "The trainee should address the rfis prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['rfi', 'conflict', 'consultant', 'response', 'distribute', 'delay'],
  },
  {
    id: "competency-rfis-b",
    skill: "submittals",
    title: "RFIs: execute and document",
    plantedDay: 25,
    deadlineDay: 30,
    threadSlugs: ["competency-rfis-b"],
    topics: /rfi|design conflict|consultant|response|field delay|distribute/i,
    expectation:
      "The trainee should address the rfis prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['rfi', 'conflict', 'consultant', 'response', 'distribute', 'delay'],
  },
  {
    id: "competency-change-management-a",
    skill: "cost",
    title: "Change Management: identify and plan",
    plantedDay: 27,
    deadlineDay: 32,
    threadSlugs: ["competency-change-management-a"],
    topics: /change order|pco|cor|pricing|schedule impact|pending change/i,
    expectation:
      "The trainee should address the change management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['pco', 'cor', 'change order', 'pricing', 'schedule impact', 'negotiate'],
  },
  {
    id: "competency-change-management-b",
    skill: "cost",
    title: "Change Management: execute and document",
    plantedDay: 28,
    deadlineDay: 33,
    threadSlugs: ["competency-change-management-b"],
    topics: /change order|pco|cor|pricing|schedule impact|pending change/i,
    expectation:
      "The trainee should address the change management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['pco', 'cor', 'change order', 'pricing', 'schedule impact', 'negotiate'],
  },
  {
    id: "competency-billing-a",
    skill: "cost",
    title: "Billing: identify and plan",
    plantedDay: 30,
    deadlineDay: 35,
    threadSlugs: ["competency-billing-a"],
    topics: /pay app|billing|stored material|lien waiver|retainage|collections|reconcile/i,
    expectation:
      "The trainee should address the billing prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['pay app', 'stored material', 'lien waiver', 'retainage', 'reconcile', 'billing'],
  },
  {
    id: "competency-billing-b",
    skill: "cost",
    title: "Billing: execute and document",
    plantedDay: 31,
    deadlineDay: 36,
    threadSlugs: ["competency-billing-b"],
    topics: /pay app|billing|stored material|lien waiver|retainage|collections|reconcile/i,
    expectation:
      "The trainee should address the billing prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['pay app', 'stored material', 'lien waiver', 'retainage', 'reconcile', 'billing'],
  },
  {
    id: "competency-quality-control-a",
    skill: "field",
    title: "Quality Control: identify and plan",
    plantedDay: 33,
    deadlineDay: 38,
    threadSlugs: ["competency-quality-control-a"],
    topics: /quality|qc|inspection|deficien|punch|testing|corrective/i,
    expectation:
      "The trainee should address the quality control prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['qc', 'inspection', 'deficien', 'punch', 'test', 'corrective'],
  },
  {
    id: "competency-quality-control-b",
    skill: "field",
    title: "Quality Control: execute and document",
    plantedDay: 34,
    deadlineDay: 39,
    threadSlugs: ["competency-quality-control-b"],
    topics: /quality|qc|inspection|deficien|punch|testing|corrective/i,
    expectation:
      "The trainee should address the quality control prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['qc', 'inspection', 'deficien', 'punch', 'test', 'corrective'],
  },
  {
    id: "competency-safety-support-a",
    skill: "field",
    title: "Safety Support: identify and plan",
    plantedDay: 36,
    deadlineDay: 41,
    threadSlugs: ["competency-safety-support-a"],
    topics: /safety|osha|incident|compliance|safety meeting|subcontractor safety/i,
    expectation:
      "The trainee should address the safety support prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['safety', 'osha', 'incident', 'compliance', 'meeting', 'documentation'],
  },
  {
    id: "competency-safety-support-b",
    skill: "field",
    title: "Safety Support: execute and document",
    plantedDay: 37,
    deadlineDay: 42,
    threadSlugs: ["competency-safety-support-b"],
    topics: /safety|osha|incident|compliance|safety meeting|subcontractor safety/i,
    expectation:
      "The trainee should address the safety support prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['safety', 'osha', 'incident', 'compliance', 'meeting', 'documentation'],
  },
  {
    id: "competency-meetings-a",
    skill: "comms",
    title: "Meetings: identify and plan",
    plantedDay: 39,
    deadlineDay: 44,
    threadSlugs: ["competency-meetings-a"],
    topics: /meeting|agenda|minutes|action item|oac|owner meeting|subcontractor meeting/i,
    expectation:
      "The trainee should address the meetings prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['agenda', 'minutes', 'action item', 'due date', 'owner', 'oac'],
  },
  {
    id: "competency-meetings-b",
    skill: "comms",
    title: "Meetings: execute and document",
    plantedDay: 40,
    deadlineDay: 45,
    threadSlugs: ["competency-meetings-b"],
    topics: /meeting|agenda|minutes|action item|oac|owner meeting|subcontractor meeting/i,
    expectation:
      "The trainee should address the meetings prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['agenda', 'minutes', 'action item', 'due date', 'owner', 'oac'],
  },
  {
    id: "competency-document-control-a",
    skill: "submittals",
    title: "Document Control: identify and plan",
    plantedDay: 42,
    deadlineDay: 47,
    threadSlugs: ["competency-document-control-a"],
    topics: /drawing log|specification log|revision|revised drawing|archive|document control/i,
    expectation:
      "The trainee should address the document control prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['drawing log', 'spec', 'revision', 'issue', 'archive', 'superseded'],
  },
  {
    id: "competency-document-control-b",
    skill: "submittals",
    title: "Document Control: execute and document",
    plantedDay: 43,
    deadlineDay: 48,
    threadSlugs: ["competency-document-control-b"],
    topics: /drawing log|specification log|revision|revised drawing|archive|document control/i,
    expectation:
      "The trainee should address the document control prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['drawing log', 'spec', 'revision', 'issue', 'archive', 'superseded'],
  },
  {
    id: "competency-coordination-a",
    skill: "comms",
    title: "Coordination: identify and plan",
    plantedDay: 45,
    deadlineDay: 50,
    threadSlugs: ["competency-coordination-a"],
    topics: /coordinate|architect|engineer|owner decision|utility|ahj|inspector|vendor/i,
    expectation:
      "The trainee should address the coordination prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['coordinate', 'owner', 'utility', 'ahj', 'inspector', 'decision'],
  },
  {
    id: "competency-coordination-b",
    skill: "comms",
    title: "Coordination: execute and document",
    plantedDay: 46,
    deadlineDay: 51,
    threadSlugs: ["competency-coordination-b"],
    topics: /coordinate|architect|engineer|owner decision|utility|ahj|inspector|vendor/i,
    expectation:
      "The trainee should address the coordination prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['coordinate', 'owner', 'utility', 'ahj', 'inspector', 'decision'],
  },
  {
    id: "competency-financial-reporting-a",
    skill: "cost",
    title: "Financial Reporting: identify and plan",
    plantedDay: 48,
    deadlineDay: 53,
    threadSlugs: ["competency-financial-reporting-a"],
    topics: /wip|profitability|earned revenue|project health|executive|monthly report/i,
    expectation:
      "The trainee should address the financial reporting prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['wip', 'profit', 'earned revenue', 'health', 'forecast', 'executive'],
  },
  {
    id: "competency-financial-reporting-b",
    skill: "cost",
    title: "Financial Reporting: execute and document",
    plantedDay: 49,
    deadlineDay: 54,
    threadSlugs: ["competency-financial-reporting-b"],
    topics: /wip|profitability|earned revenue|project health|executive|monthly report/i,
    expectation:
      "The trainee should address the financial reporting prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['wip', 'profit', 'earned revenue', 'health', 'forecast', 'executive'],
  },
  {
    id: "competency-risk-management-a",
    skill: "comms",
    title: "Risk Management: identify and plan",
    plantedDay: 51,
    deadlineDay: 56,
    threadSlugs: ["competency-risk-management-a"],
    topics: /risk register|schedule risk|cost risk|procurement risk|unresolved|claim/i,
    expectation:
      "The trainee should address the risk management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['risk register', 'risk', 'claim', 'notice', 'mitigate', 'documentation'],
  },
  {
    id: "competency-risk-management-b",
    skill: "comms",
    title: "Risk Management: execute and document",
    plantedDay: 52,
    deadlineDay: 57,
    threadSlugs: ["competency-risk-management-b"],
    topics: /risk register|schedule risk|cost risk|procurement risk|unresolved|claim/i,
    expectation:
      "The trainee should address the risk management prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['risk register', 'risk', 'claim', 'notice', 'mitigate', 'documentation'],
  },
  {
    id: "competency-field-support-a",
    skill: "field",
    title: "Field Support: identify and plan",
    plantedDay: 54,
    deadlineDay: 59,
    threadSlugs: ["competency-field-support-a"],
    topics: /superintendent|constructability|manpower|sequencing|roadblock|field question/i,
    expectation:
      "The trainee should address the field support prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['superintendent', 'constructability', 'manpower', 'sequence', 'roadblock', 'action'],
  },
  {
    id: "competency-field-support-b",
    skill: "field",
    title: "Field Support: execute and document",
    plantedDay: 55,
    deadlineDay: 60,
    threadSlugs: ["competency-field-support-b"],
    topics: /superintendent|constructability|manpower|sequencing|roadblock|field question/i,
    expectation:
      "The trainee should address the field support prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['superintendent', 'constructability', 'manpower', 'sequence', 'roadblock', 'action'],
  },
  {
    id: "competency-closeout-a",
    skill: "field",
    title: "Closeout: identify and plan",
    plantedDay: 57,
    deadlineDay: 62,
    threadSlugs: ["competency-closeout-a"],
    topics: /closeout|punch|o&m|warranty|as-built|certificate of occupancy|retainage/i,
    expectation:
      "The trainee should address the closeout prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['closeout', 'punch', 'warranty', 'as-built', 'co', 'certificate of occupancy'],
  },
  {
    id: "competency-closeout-b",
    skill: "field",
    title: "Closeout: execute and document",
    plantedDay: 58,
    deadlineDay: 63,
    threadSlugs: ["competency-closeout-b"],
    topics: /closeout|punch|o&m|warranty|as-built|certificate of occupancy|retainage/i,
    expectation:
      "The trainee should address the closeout prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['closeout', 'punch', 'warranty', 'as-built', 'co', 'certificate of occupancy'],
  },
  {
    id: "competency-technology-a",
    skill: "submittals",
    title: "Technology: identify and plan",
    plantedDay: 60,
    deadlineDay: 65,
    threadSlugs: ["competency-technology-a"],
    topics: /procore|bluebeam|microsoft project|primavera|excel|pdf markup|accounting software|document management/i,
    expectation:
      "The trainee should address the technology prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['procore', 'bluebeam', 'excel', 'pdf', 'rfi', 'submittal'],
  },
  {
    id: "competency-technology-b",
    skill: "submittals",
    title: "Technology: execute and document",
    plantedDay: 61,
    deadlineDay: 66,
    threadSlugs: ["competency-technology-b"],
    topics: /procore|bluebeam|microsoft project|primavera|excel|pdf markup|accounting software|document management/i,
    expectation:
      "The trainee should address the technology prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['procore', 'bluebeam', 'excel', 'pdf', 'rfi', 'submittal'],
  },
  {
    id: "competency-leadership-a",
    skill: "comms",
    title: "Leadership: identify and plan",
    plantedDay: 63,
    deadlineDay: 68,
    threadSlugs: ["competency-leadership-a"],
    topics: /leadership|subcontractor conflict|mentor|delegate|prioritize|negotiate|uncertainty|trust/i,
    expectation:
      "The trainee should address the leadership prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['prioritize', 'delegate', 'negotiate', 'decision', 'mentor', 'owner'],
  },
  {
    id: "competency-leadership-b",
    skill: "comms",
    title: "Leadership: execute and document",
    plantedDay: 64,
    deadlineDay: 69,
    threadSlugs: ["competency-leadership-b"],
    topics: /leadership|subcontractor conflict|mentor|delegate|prioritize|negotiate|uncertainty|trust/i,
    expectation:
      "The trainee should address the leadership prompt with a specific PM action plan, responsible parties, documentation, and follow-up before the deadline.",
    handledKeywords: ['prioritize', 'delegate', 'negotiate', 'decision', 'mentor', 'owner'],
  },

  // ── RFIs & Submittals ───────────────────────────────────────────────────
  {
    id: "elevator-submittal",
    skill: "submittals",
    title: "Protect the elevator fab slot through submittals",
    plantedDay: 16,
    deadlineDay: 40,
    threadSlugs: ["vendor-elevator-submittals", "architect-submittal-mockup"],
    topics: /elevator|fab slot|apex|hoistway|cab (finish|interior)/i,
    expectation:
      "Drive the elevator submittal cycle to protect the fab slot: get submittals moving on the vendor's deadline, and when the architect splits the return, resubmit the revise-and-resubmit portion immediately rather than letting the package sit.",
    handledKeywords: ["submittal", "resubmit", "fab slot", "elevator", "approved as noted"],
    consequence: {
      day: 55,
      senderKey: "elevator_vendor",
      subject: "Fab Slot Released — Elevator Delivery Now Slips ~10 Weeks",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I held the ${ctx.projectLabel} production slot as long as manufacturing would let me, but with the submittal package still not fully approved, they've <strong>released it to another project</strong>. I told you when we quoted this that the slot was the schedule.</p>

<p>What that means in real terms:</p>
<ul>
  <li>Next available slot puts <strong>equipment delivery roughly 10 weeks later</strong> than planned — which lands your elevator install after the date you needed inspections, and state inspector backlogs are already running long.</li>
  <li>A building can't get its certificate of occupancy without a passed elevator inspection. This is now a critical-path item.</li>
  <li>There's a partial-recovery option — split the cab finishes into a later shipment — but the core equipment still needs the full approved package before it enters the queue.</li>
</ul>

<p>Get me the approved submittals and I'll fight for the earliest slot that opens. But the easy version of this schedule is gone.</p>

<p>Tom Garrity<br/>Project Sales Engineer, Apex Elevator Systems<br/>(678) 555-0348</p>
`.trim(),
    },
    confirmation: {
      day: 55,
      senderKey: "elevator_vendor",
      subject: "Elevator Package Fully Approved — Fab Slot Held, Delivery On Plan",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Confirming the good outcome on the ${ctx.projectLabel} elevator package: with the resubmittal turned around quickly after the architect's split return, the <strong>full package is approved and your fab slot held</strong>. Equipment enters production on schedule and delivery supports your install and inspection sequence as planned.</p>

<p>You'd be surprised how many jobs lose their slot to a submittal sitting in someone's inbox for three weeks. Not this one.</p>

<p>Tom Garrity<br/>Project Sales Engineer, Apex Elevator Systems<br/>(678) 555-0348</p>
`.trim(),
    },
  },
  // ── Utility service application (load letter) ───────────────────────────
  {
    id: "utility-load-letter",
    skill: "schedule",
    title: "Answer the utility's service application (load letter)",
    plantedDay: 5,
    deadlineDay: 13,
    threadSlugs: ["utility-service-application"],
    topics: /load letter|service application|piedmont|transformer|panel location|load center|ampacit|utility design/i,
    expectation:
      "Respond to Piedmont Power & Light's service application: get the engineer's load letter and the panel/load-center locations and ampacities to the utility so their transformer design clock starts — utility design lead time is on the critical path to energization.",
    handledKeywords: ["load letter", "service application", "transformer", "ampacit", "panel location", "utility", "submitted"],
    consequence: {
      day: 24,
      senderKey: "utility_rep",
      subject: "Your design queue slot lapsed — transformer design hasn't started",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Following up with bad news. I held a design-queue slot for the ${ctx.projectLabel} service while I waited on your load letter and panel locations — and the hold expired without a submittal. That means <strong>our transformer design hasn't started</strong>, and my engineering queue is now running 10 to 12 weeks before a designer even opens the job.</p>

<p>Chain reaction you should understand: no design → no transformer order → no metering plan → no energization date. Depending on transformer availability, this can put your permanent power well behind your gear delivery — and I can't expedite what hasn't been submitted.</p>

<p>Send me the load letter and the one-line with panel/load-center locations and ampacities this week and I'll do what I can to claw back queue position.</p>

<p>Marcus Reed<br/>Service Design Consultant, Piedmont Power &amp; Light<br/>(770) 555-0455</p>
`.trim(),
    },
    confirmation: {
      day: 24,
      senderKey: "utility_rep",
      subject: "Service application complete — transformer design underway",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Good news: because your load letter and panel/ampacity information came in inside my design-queue window, the ${ctx.projectLabel} service design is <strong>underway</strong> and the transformer is being sized now. You're positioned well ahead of the energization sequence — that early submittal is the difference between the utility waiting on you and you waiting on the utility.</p>

<p>Next touchpoint will be the energization checklist as we get closer. Nice work staying in front of it.</p>

<p>Marcus Reed<br/>Service Design Consultant, Piedmont Power &amp; Light<br/>(770) 555-0455</p>
`.trim(),
    },
  },

  // ── Special inspections per the permit conditions ────────────────────────
  {
    id: "special-inspections",
    skill: "field",
    title: "Stand up special inspections before foundation work",
    plantedDay: 11,
    deadlineDay: 18,
    threadSlugs: ["city-permit-conditions"],
    topics: /special inspection|statement of special|inspection matrix|permit condition|testing agency.*engag|iic|1704/i,
    expectation:
      "Act on the permit conditions: engage the special-inspections agency, get the statement of special inspections on file with the city, and build the inspection matrix before footings and structural work begin.",
    handledKeywords: ["special inspection", "statement of special", "inspection matrix", "engage", "testing agency", "on file"],
    consequence: {
      day: 30,
      senderKey: "building_dept",
      subject: "STOP WORK — footings poured without required special inspections",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Our field inspector visited the ${ctx.projectLabel} site yesterday and found <strong>footings placed with no special-inspection reports on file</strong> — the statement of special inspections your permit is conditioned on was never returned, and no approved agency is of record. Per the permit conditions I have issued a <strong>stop-work order on structural concrete</strong>.</p>

<p>To release it, you'll need your engineer of record to propose a remediation path for the work already covered — typically exposing representative footings and/or coring, with the testing agency documenting everything after the fact. That is slower and more expensive than simply having the inspector there for the pour, which is exactly why the condition exists.</p>

<p>Get the statement and agency engagement letter to my office and we'll schedule the remediation review.</p>

<p>Angela Torres<br/>Inspections Coordinator, Building Department — City of Riverton<br/>(770) 555-0470</p>
`.trim(),
    },
    confirmation: {
      day: 30,
      senderKey: "building_dept",
      subject: "Special inspections on file — you're clear through structure",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Confirming receipt of your statement of special inspections and the agency engagement for the ${ctx.projectLabel} project. Your inspection matrix matches the permit conditions, reports are flowing to us as required, and our field inspector noted the under-slab and footing inspections were called in properly and on time.</p>

<p>That's how it's supposed to work — you're clear to keep moving through structure. Keep the reports current and we'll stay out of your way.</p>

<p>Angela Torres<br/>Inspections Coordinator, Building Department — City of Riverton<br/>(770) 555-0470</p>
`.trim(),
    },
  },

  // ── Low 7-day concrete breaks ────────────────────────────────────────────
  {
    id: "low-breaks-followup",
    skill: "field",
    title: "Act on the low 7-day concrete breaks",
    plantedDay: 26,
    deadlineDay: 33,
    threadSlugs: ["testing-low-breaks"],
    topics: /low break|7-day|seven.?day|28-day|cylinder|core|psi|concrete strength|hold.*pour|seor/i,
    expectation:
      "Treat the low 7-day breaks as a live structural question: put the affected placements on hold status with the structural engineer, keep loading/shoring decisions conservative until 28-day results, and have a plan (cores, petrographic, mix review) ready if they don't recover.",
    handledKeywords: ["hold", "28-day", "core", "seor", "structural engineer", "mix design", "shoring", "investigation"],
    consequence: {
      day: 44,
      senderKey: "testing_agency",
      subject: "28-day breaks came back low — and the floors above are already loaded",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The 28-day cylinders for the placements we flagged came back <strong>below design strength</strong> — they never recovered. The harder problem: because no hold or restriction was placed on those areas after the 7-day warning, <strong>the structure above has continued loading</strong> — framing, decks, and material staging are sitting on concrete that hasn't proven out.</p>

<p>The structural engineer is now requiring cores at multiple locations, a shoring review of everything above the suspect placements, and no further loading until the analysis is complete. That's a multi-week disruption right through your critical path — most of which a hold at day 7 would have avoided.</p>

<p>My crew can core Thursday. Please have access and the SEOR's core plan ready.</p>

<p>Owen Blake<br/>Field Operations Manager, Meridian Testing Labs<br/>(770) 555-0429</p>
`.trim(),
    },
    confirmation: {
      day: 44,
      senderKey: "testing_agency",
      subject: "28-day results in — your hold on the suspect placements paid off",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Closing the loop on the low 7-day breaks: the 28-day results recovered on most of the placements, and the two that stayed marginal passed on cores — the SEOR has accepted all of it in writing. Because you put the affected areas on hold and kept loading conservative until the numbers proved out, there's <strong>no re-analysis, no shoring review, and no schedule impact</strong>.</p>

<p>For what it's worth, most GCs ignore the 7-day warning and hope. Yours is the version of this story that ends well.</p>

<p>Owen Blake<br/>Field Operations Manager, Meridian Testing Labs<br/>(770) 555-0429</p>
`.trim(),
    },
  },

  // ── Sub insurance certificate lapse ──────────────────────────────────────
  {
    id: "coi-lapse",
    skill: "buyout",
    title: "Cure Ironclad's expired insurance certificate",
    plantedDay: 23,
    deadlineDay: 30,
    threadSlugs: ["acct-coi-lapse"],
    topics: /coi|certificate of insurance|ironclad.*insur|insur.*ironclad|additional insured|acord|gl polic|umbrella|expired cert/i,
    expectation:
      "Treat the lapsed COI as a stop-the-line compliance issue: demand a current certificate with the required additional-insured endorsements from Ironclad immediately, and hold payment (and if needed site access) until it's in hand — don't let an uninsured sub keep working the riskiest trade.",
    handledKeywords: ["coi", "certificate", "additional insured", "endorsement", "hold payment", "renewal", "insurance"],
    consequence: {
      day: 40,
      senderKey: "accounting",
      subject: "Owner's risk manager found the expired COI — now it's an audit",
      html: (ctx) =>
        `
<p>Hi ${ctx.pmFirst},</p>

<p>The thing I flagged became the thing. A near-miss on the steel erection (dropped choker, nobody hurt) triggered the owner's incident-report process, and their <strong>risk manager pulled the insurance file — and found Ironclad working for weeks on an expired certificate</strong> with no additional-insured endorsements in place.</p>

<p>Where that leaves us: the owner has issued a formal notice citing us for a compliance breach of the prime contract's insurance article, Ironclad is barred from site until a conforming cert is on file, and the owner is now auditing <strong>every</strong> sub's insurance on the job. I'm spending my week producing certificates instead of closing the pay app, and steel is stood down while Ironclad's broker scrambles.</p>

<p>We knew about this on day one of the lapse. Chasing the cert then would have been one email.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
    },
    confirmation: {
      day: 40,
      senderKey: "accounting",
      subject: "Ironclad's insurance cured — compliance file is clean again",
      html: (ctx) =>
        `
<p>Hi ${ctx.pmFirst},</p>

<p>Closing this one out: Ironclad's renewed certificate came in with the additional-insured and primary-noncontributory endorsements the subcontract requires, backdated to the renewal so there's no coverage gap on paper. Because you jumped on it — and held their payment until the broker produced the endorsements, not just the ACORD — the file was clean before anyone else ever looked at it.</p>

<p>I've re-audited the rest of the subs while I was at it: everyone's current. Good catch, handled the right way.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
    },
  },

  // ── Owner early access / FF&E ────────────────────────────────────────────
  {
    id: "ffe-early-access",
    skill: "comms",
    title: "Put conditions on the owner's early-access request",
    plantedDay: 57,
    deadlineDay: 64,
    threadSlugs: ["owner-early-access"],
    topics: /early access|ff&e|ffe|beneficial|move.?in|load.?in|vendor access|access agreement/i,
    expectation:
      "Answer Elaine's early-access/FF&E request with real conditions rather than a yes or a shrug: a written early-access agreement, insurance/liability terms, life-safety and finish status in the area, badging/protection requirements, and a realistic window tied to those conditions.",
    handledKeywords: ["early access", "agreement", "insurance", "conditions", "in writing", "beneficial", "protection", "life safety"],
    consequence: {
      day: 69,
      senderKey: "owner_rep",
      subject: "My FF&E vendor got turned away at the gate — this is on both of us",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Since I never got an answer on early access, my FF&E vendor took my silence-plus-optimism as a yes and showed up this morning with two trucks. Your superintendent — correctly — turned them away: no insurance on file, no access agreement, active life-safety testing in the area. So now I'm paying demobilization charges on a furniture crew, my move-in sequence is scrambled, and I look disorganized in front of my own vendor.</p>

<p>I asked you for a date and the conditions to hit it. "Here's what has to be true, here's the paperwork, here's the realistic window" — that's a ten-minute email, and it's the difference between this morning and a clean load-in. I still need it: send me the early-access conditions and agreement this week, because the furniture is coming back whether we're ready or not.</p>

<p>Elaine Whitfield<br/>Director of Development, Meridian Development Partners<br/>(404) 555-0410</p>
`.trim(),
    },
    confirmation: {
      day: 69,
      senderKey: "owner_rep",
      subject: "RE: Early access — agreement signed, load-in scheduled",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The early-access package you sent was exactly what I needed — conditions, insurance requirements, the agreement, and a realistic window tied to the life-safety status. Our counsel signed off with no edits, the vendor's COI is on file with your office, and the lobby load-in is booked inside the window you gave me, with your protection plan in place.</p>

<p>This is the kind of answer that makes my board think the project is in good hands — because it is. Thank you.</p>

<p>Elaine Whitfield<br/>Director of Development, Meridian Development Partners<br/>(404) 555-0410</p>
`.trim(),
    },
  },

  // ── Fire alarm acceptance / ERRC ─────────────────────────────────────────
  {
    id: "fire-alarm-acceptance",
    skill: "schedule",
    title: "Lock the fire alarm acceptance test (and ERRC results)",
    plantedDay: 59,
    deadlineDay: 66,
    threadSlugs: ["fire-marshal-acceptance"],
    topics: /acceptance test|fire alarm|fire marshal|errc|bda|radio coverage|100%|pretest|certificate of occupancy/i,
    expectation:
      "Drive the occupancy-critical chain: pre-test the fire alarm with the installing contractor, get the ERRC/radio-coverage testing done and documented, and lock the acceptance-test date with the fire marshal — before the CO date is at the AHJ's mercy.",
    handledKeywords: ["acceptance test", "pretest", "pre-test", "errc", "radio coverage", "schedule", "fire marshal", "booked"],
    consequence: {
      day: 74,
      senderKey: "fire_marshal",
      subject: "No acceptance test on my calendar — your CO date is now at risk",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I laid out the acceptance-test requirements weeks ago and my calendar still shows nothing booked for the ${ctx.projectLabel} project — no 100% pre-test certification from your alarm contractor, and <strong>no ERRC test results</strong>, which I told you I require before I will even schedule. My next available acceptance window is now <strong>three weeks out</strong>, and I fail buildings that come to test unprepared.</p>

<p>Do the math on your certificate of occupancy: no acceptance, no CO. If your occupancy date mattered, this test should have been locked the week I wrote you. Get me the pre-test certification and the ERRC report, and I'll hold the next open slot — but I won't bump other projects because yours didn't plan.</p>

<p>Sandra Okoye<br/>Deputy Fire Marshal, City of Riverton<br/>(770) 555-0482</p>
`.trim(),
    },
    confirmation: {
      day: 74,
      senderKey: "fire_marshal",
      subject: "Acceptance test passed — life-safety systems accepted",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>For the record: the ${ctx.projectLabel} fire alarm acceptance test <strong>passed on the first attempt</strong>. Your contractor's 100% pre-test showed — device response was clean, supervision and monitoring checked out, and the ERRC results were on my desk before I asked twice, which almost never happens. Life-safety systems are accepted, and my sign-off is in for your certificate of occupancy.</p>

<p>First-attempt passes are rare. That's what a properly run pre-test looks like — well done.</p>

<p>Sandra Okoye<br/>Deputy Fire Marshal, City of Riverton<br/>(770) 555-0482</p>
`.trim(),
    },
  },
];

/**
 * The planted-scenario set for a project type. Healthcare sandboxes use the VA /
 * hospital scenarios (lib/training-healthcare.ts); every other type uses the
 * default set above.
 */
export function scenariosForType(
  projectType: string | null | undefined,
): TrainingScenario[] {
  return projectType === HEALTHCARE_TYPE ? HC_SCENARIOS : TRAINING_SCENARIOS;
}

/**
 * Look up a scenario by id across BOTH packs — competency aggregation runs over
 * a user's sandboxes of any type, so it must resolve default and healthcare
 * scenario ids alike. Ids are unique across packs.
 */
export function getTrainingScenario(id: string): TrainingScenario | undefined {
  return (
    TRAINING_SCENARIOS.find((s) => s.id === id) ?? HC_SCENARIOS.find((s) => s.id === id)
  );
}

/** Scenarios whose action deadline has passed by the given in-sim day. */
export function scenariosDueBy(
  day: number,
  projectType?: string | null,
): TrainingScenario[] {
  return scenariosForType(projectType).filter((s) => s.deadlineDay < day);
}
