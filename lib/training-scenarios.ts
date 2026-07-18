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
];

export function getTrainingScenario(id: string): TrainingScenario | undefined {
  return TRAINING_SCENARIOS.find((s) => s.id === id);
}

/** Scenarios whose action deadline has passed by the given in-sim day. */
export function scenariosDueBy(day: number): TrainingScenario[] {
  return TRAINING_SCENARIOS.filter((s) => s.deadlineDay < day);
}
