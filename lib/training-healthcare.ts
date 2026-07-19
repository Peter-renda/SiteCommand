/**
 * Healthcare project "pack" for SiteCommand Training sandboxes.
 *
 * The base training content (lib/training-emails.ts, -inbox.ts, -scenarios.ts,
 * -meetings.ts) drives a private, CM-at-Risk / GMP developer job. This module is
 * a SECOND, self-contained content set selected when a sandbox's project type is
 * `healthcare` — a federal **VA hospital renovation** (Nashville VA Medical
 * Center, Buildings 626–700, solicitation 36C77624B0029, SF 1442 firm-fixed-price
 * SDVOSB set-aside). The people, gotchas, and meetings are deliberately DIFFERENT
 * from the default job:
 *
 *   - The "owner" is a by-the-book VA **Contracting Officer** and an overworked
 *     **COR** who can't authorize changes — not a commercial developer.
 *   - Federal / hospital gotchas replace the developer ones: **ICRA** infection
 *     control permits, **ILSM** interim life safety, VA **PIV/badging** lead
 *     time, the **VAAR 85% limitations-on-subcontracting** (SDVOSB) cap, planned
 *     **utility shutdowns** in an occupied hospital, **Davis-Bacon certified
 *     payroll**, **medical-gas (NFPA 99 / ASSE) certification**, and a **differing
 *     site condition** (unforeseen asbestos) that must go through an REA, not a
 *     verbal COR direction.
 *
 * Consumed via the type-aware selectors in the base modules (`subsForType`,
 * `inboxSendersForType`, `inboxEmailsForType`, `scenariosForType`,
 * `meetingsForType`) and the handoff branch in lib/training-seed.ts. Imports are
 * TYPE-ONLY from the base modules so there is no runtime import cycle (the base
 * modules import the values here; the erased type imports don't loop back).
 */

import type { TrainingSub } from "@/lib/training-emails";
import type { InboxSender, TrainingInboxEmail } from "@/lib/training-inbox";
import type { TrainingScenario } from "@/lib/training-scenarios";
import type { TrainingMeeting, MeetingSpeaker } from "@/lib/training-meetings";

export const HEALTHCARE_TYPE = "healthcare";

/* ── Handoff context (owner / A-E / delivery / brief + the 17 bid files) ──── */

export const HC_OWNER = "U.S. Department of Veterans Affairs";
export const HC_CONTRACTING_OFFICE = "VA Nashville — Network Contracting Office 9 (NCO 9)";
export const HC_ARCHITECT = "Cumberland Healthcare Architects (A/E of Record)";
export const HC_DELIVERY = "Design-Bid-Build · Firm-Fixed-Price (SF 1442) · SDVOSB set-aside";

/** Per-type brief override used by the handoff (mirrors seed's TYPE_BRIEF shape). */
export const HC_BRIEF = {
  value: 34_500_000,
  size: "≈168,000 GSF across occupied Buildings 626–700",
  scope:
    "an infrastructure upgrade and space-reconfiguration renovation at an operating VA medical center — electrical/normal-and-emergency power, UPS, bonding/grounding, and building-management-system upgrades, plus reconfiguring and renovating the clinical spaces impacted, all phased around live patient care",
  months: 20,
};

/** IFC drawing set (the 17 uploaded VA bid files, by discipline). Served from
 *  public/training as static assets. */
export const HC_DRAWINGS: { label: string; file: string }[] = [
  { label: "Sheet Index — 626-700", file: "Attachment 11 - Sheet Index Drawings 626-700.SHEET INDEX.20240308.pdf" },
  { label: "General Drawings (GI) — 626-700", file: "Attachment 8 - General Drawings 626-700.GI.20240308.pdf" },
  { label: "Civil / Site Drawings (CS) — 626-700", file: "Attachment 5 - Civil Drawings 626-700.CS.20240308.pdf" },
  { label: "Architectural Drawings (AE) — 626-700", file: "Attachment 4 - Architectural Drawings 626-700.AE.20240308.pdf" },
  { label: "Structural Drawings (SF) — 626-700", file: "Attachment 12 - Structural Drawings 626-700.SF.20240308.pdf" },
  { label: "Mechanical / HVAC Drawings (MH) — 626-700", file: "Attachment 9 - Mechanical Drawings 626-700.MH.20240308.pdf" },
  { label: "Plumbing / Med-Gas Drawings (PL) — 626-700", file: "Attachment 10 - Plumbing Drawings 626-700.PL.20240308.pdf" },
  { label: "Electrical Drawings (EP) — 626-700", file: "Attachment 6 - Electrical Drawings 626-700.EP.20240308.pdf" },
  { label: "Fire Protection Drawings (FX) — 626-700", file: "Attachment 7 - Fire Protection Drawings 626-700.FX.20240308.pdf" },
  { label: "Telecommunications Drawings — Part 1 (p.1–66)", file: "Attachment_13_-_Telecommunications_Drawings_Part1_p1-66.pdf" },
  { label: "Telecommunications Drawings — Part 2 (p.67–132)", file: "Attachment_13_-_Telecommunications_Drawings_Part2_p67-132.pdf" },
];

/** Project manual / specifications. */
export const HC_SPECS: { label: string; file: string }[] = [
  { label: "Specifications — Volume 1 (Revised)", file: "Attachment 2 - Specifications VOL 1 - Revised.pdf" },
  { label: "Specifications — Volume 2 (Revised)", file: "Attachment 3 - Specifications VOL 2 - Revised.pdf" },
];

/** Front-end / contract & compliance documents (the solicitation, amendment,
 *  SDVOSB limitations clause, and Davis-Bacon wage determination). */
export const HC_CONTRACT_DOCS: { label: string; file: string }[] = [
  { label: "Solicitation 36C77624B0029 — SF 1442 (Construction)", file: "36C77624B0029.docx" },
  { label: "Solicitation 36C77624B0029 — Amendment 0001", file: "36C77624B0029 0001.docx" },
  { label: "VAAR 852.219-75 — Limitations on Subcontracting (Construction)", file: "Attachment 1 - Limitations on Subcontracting - Construction.docx" },
  { label: "Davis-Bacon Wage Determination — WDTN20230178 Mod 3 (07-26-2024)", file: "Attachment 14 - WDTN20230178 MOD 3 - 7-26-2024.pdf" },
];

/* ── Subcontractor roster (healthcare trades, distinct personalities) ─────── */

/**
 * VA-hospital renovation trades. Distinct from the default job's roster: the
 * scopes are infrastructure/healthcare (selective demo + ICRA/abatement,
 * med-gas, HEPA-filtered mechanical, nurse-call/BMS low voltage) and several
 * firms are SDVOSB/VOSB-relevant to the 85% subcontracting-limit gotcha.
 */
export const HC_SUBS: TrainingSub[] = [
  { trade: "Selective Demolition & Abatement", company: "Tennessee Abatement & Demo (SDVOSB)", first: "Reuben", last: "Castillo", phone: "(615) 555-0260", bid: 1_950_000 },
  { trade: "Electrical / Normal & Emergency Power", company: "Volunteer Electric (SDVOSB)", first: "Dwayne", last: "Fields", phone: "(615) 555-0212", bid: 7_600_000 },
  { trade: "Mechanical / HVAC & HEPA", company: "Highland Mechanical Systems", first: "Priya", last: "Venkatesh", phone: "(615) 555-0247", bid: 6_400_000 },
  { trade: "Plumbing & Medical Gas", company: "Cumberland Plumbing & Med-Gas", first: "Roy", last: "Ferguson", phone: "(615) 555-0233", bid: 3_850_000 },
  { trade: "Fire Protection / Sprinkler", company: "Guardian Fire Protection (VOSB)", first: "Latoya", last: "Simmons", phone: "(615) 555-0291", bid: 1_480_000 },
  { trade: "Low Voltage / Nurse Call & BMS", company: "Signal Point Technologies", first: "Andre", last: "Kowalski", phone: "(615) 555-0305", bid: 2_150_000 },
  { trade: "Drywall / ACT / Finishes", company: "Music City Interiors", first: "Gina", last: "Petrossian", phone: "(615) 555-0274", bid: 2_900_000 },
  { trade: "Resilient Flooring / Sheet Vinyl", company: "Southeast Surfaces", first: "Marcus", last: "Bell", phone: "(615) 555-0288", bid: 1_320_000 },
];

/** How many roster trades get a seeded buyout email thread on launch. */
export const HC_BUYOUT_THREAD_COUNT = 5;

/* ── Inbox senders (the VA / hospital cast) ──────────────────────────────── */

export const HC_INBOX_SENDERS: Record<string, InboxSender> = {
  // Internal accounting — resolved to the GC company at delivery (same key/shape
  // as the default pack so the pay-app/Davis-Bacon mail reads as in-house).
  accounting: {
    key: "accounting",
    first: "Janet",
    last: "Kim",
    title: "Accounting Manager",
    company: "GC",
    phone: "(615) 555-0195",
    internal: true,
  },
  contracting_officer: {
    key: "contracting_officer",
    first: "Karen",
    last: "Whitlock",
    title: "Contracting Officer (CO), NCO 9",
    company: "Department of Veterans Affairs",
    phone: "(615) 555-0600",
  },
  cor: {
    key: "cor",
    first: "Reginald",
    last: "Foster",
    title: "Contracting Officer's Representative (COR)",
    company: "Department of Veterans Affairs",
    phone: "(615) 555-0612",
  },
  infection_control: {
    key: "infection_control",
    first: "Diane",
    last: "Alvarado",
    title: "Infection Preventionist, RN (ICRA Authority)",
    company: "Nashville VA Medical Center",
    phone: "(615) 555-0640",
  },
  va_police: {
    key: "va_police",
    first: "Marcus",
    last: "Hale",
    title: "VA Police — Credentialing & PIV Badging",
    company: "Nashville VA Medical Center",
    phone: "(615) 555-0655",
  },
  facilities: {
    key: "facilities",
    first: "Bill",
    last: "Trainor",
    title: "Chief, Facilities Management (Hospital Engineering)",
    company: "Nashville VA Medical Center",
    phone: "(615) 555-0668",
  },
  ae_architect: {
    key: "ae_architect",
    first: "Gerald",
    last: "Hoffman",
    title: "Principal Architect (A/E of Record)",
    company: "Cumberland Healthcare Architects",
    phone: "(615) 555-0521",
  },
  ups_vendor: {
    key: "ups_vendor",
    first: "Curtis",
    last: "Bao",
    title: "Critical Power Sales Engineer",
    company: "TriPower Critical Systems",
    phone: "(678) 555-0322",
  },
  testing_agency: {
    key: "testing_agency",
    first: "Marla",
    last: "Jennings",
    title: "Special Inspections Manager",
    company: "Volunteer Testing & Inspection",
    phone: "(615) 555-0429",
  },
};

/* ── Inbox email schedule (VA / hospital gotchas, day-keyed) ──────────────── */

function invoiceHtml(inv: {
  vendor: string;
  vendorAddress: string;
  number: string;
  date: string;
  terms: string;
  lines: { desc: string; amount: number }[];
}): string {
  const money = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = inv.lines.reduce((s, l) => s + l.amount, 0);
  const rows = inv.lines
    .map(
      (l) => `    <tr>
      <td style="padding:6px 10px;border:1px solid #d1d5db;">${l.desc}</td>
      <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;white-space:nowrap;">${money(l.amount)}</td>
    </tr>`,
    )
    .join("\n");
  return `
<table style="border-collapse:collapse;width:100%;max-width:560px;margin:12px 0;font-size:13px;">
  <tr>
    <td colspan="2" style="padding:8px 10px;border:1px solid #d1d5db;background:#f3f4f6;">
      <strong>INVOICE ${inv.number}</strong><br/>
      ${inv.vendor} — ${inv.vendorAddress}<br/>
      Invoice date: ${inv.date} · Terms: ${inv.terms}
    </td>
  </tr>
${rows}
  <tr>
    <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;"><strong>Total Due</strong></td>
    <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;white-space:nowrap;"><strong>${money(total)}</strong></td>
  </tr>
</table>`.trim();
}

/**
 * VA / hospital inbound schedule. Days line up with the shared PM calendar
 * (buyout Days 1-7, construction phases on Days 14/28/42/56/70). Each email
 * plants a decision or a fact the trainee should act on; several are closed out
 * by a scenario in HC_SCENARIOS (miss/handle ripples).
 */
export const HC_INBOX_EMAILS: TrainingInboxEmail[] = [
  // ── Day 2 — VA Police: PIV / badging lead time ────────────────────────────
  {
    day: 2,
    slug: "va-badging-roster",
    senderKey: "va_police",
    subject: "ACTION REQUIRED — Contractor PIV Badging & Background Checks (submit rosters now)",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Welcome to the Nashville VA campus. Before <strong>anyone</strong> from your team or your subcontractors sets foot inside the perimeter for the Building 626–700 project, they must clear a background check and be issued a contractor PIV/credential. This is not the same as a hard-hat orientation — it is a federal credentialing process and it takes time.</p>

<ul>
  <li>Submit a <strong>full worker roster</strong> (legal name, DOB, SSN, citizenship) for every person who will need access — GC and every sub tier.</li>
  <li>Background adjudication is currently running <strong>3 to 4 weeks</strong>. Rosters submitted late = crews standing at the gate on mobilization day with no way in.</li>
  <li>Escorted access is possible in a pinch but I have limited officers; do not build your schedule on escorts.</li>
</ul>

<p>Get me the initial rosters as early as you can. The subs you plan to mobilize first — demo, electrical — should be at the top of the stack.</p>

<p>Marcus Hale<br/>VA Police — Credentialing & PIV Badging<br/>Nashville VA Medical Center<br/>(615) 555-0655</p>
`.trim(),
  },

  // ── Day 3 — Infection Control: ICRA permit + ILSM ─────────────────────────
  {
    day: 3,
    slug: "icra-permit-required",
    senderKey: "infection_control",
    subject: "No work in occupied areas without an approved ICRA permit",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>I'm the Infection Preventionist for the medical center and I will be signing your ICRA permits, so let's start on the same page. This is an <em>occupied hospital.</em> Renovation dust is not cosmetic here — <em>Aspergillus</em> from construction dust can kill an immunocompromised patient. So:</p>

<ul>
  <li>An <strong>Infection Control Risk Assessment (ICRA) permit</strong> must be approved <strong>before any demolition or construction</strong> begins in or adjacent to occupied space — including above-ceiling work in active corridors.</li>
  <li>The 626 connector and the corridors tie into patient care areas — I'm preliminarily calling those a <strong>Class IV</strong> precaution: full hard-barrier containment, negative air with HEPA, anteroom, and daily monitoring.</li>
  <li>Submit your ICRA plan with your <strong>Interim Life Safety Measures (ILSM)</strong> plan together. I will walk every barrier before I sign.</li>
</ul>

<p>Break containment or start without a signed permit and I will shut the area down and write it up to hospital leadership. I'd much rather approve you and never have that conversation.</p>

<p>Diane Alvarado, RN, CIC<br/>Infection Preventionist, Nashville VA Medical Center<br/>(615) 555-0640</p>
`.trim(),
  },

  // ── Day 5 — COR: kickoff, schedule, phasing, and "changes go through the CO" ─
  {
    day: 5,
    slug: "cor-kickoff-submittals",
    senderKey: "cor",
    subject: "Post-Award Kickoff — schedule, phasing, SF-1413 & the ground rules",
    html: (ctx) =>
      `
<p>Hi ${ctx.pmFirst},</p>

<p>I'm your COR on the 626–700 project — I'll be your day-to-day VA point of contact and I'll be on site a lot. A few things to get moving, and one ground rule I need you to hear clearly.</p>

<ul>
  <li>Get me your baseline <strong>construction schedule</strong> and a <strong>phasing plan</strong> that keeps clinics operating — we cannot take swing space and patient corridors offline at will.</li>
  <li>Submit your <strong>SF-1413 (List of Subcontractors)</strong> and stand up your <strong>certified payroll</strong> process before the first crew works.</li>
  <li>Build your submittal register off the spec and let's agree on turnaround.</li>
</ul>

<p><strong>The ground rule:</strong> I am <em>not</em> a Contracting Officer. I cannot authorize extra work, direct a change, or promise you money or time — only the CO, Ms. Whitlock, can do that in writing. If I ever say something in the field that sounds like a change, get it confirmed by the CO before you spend a dollar on it. I'm telling you now so it's not a surprise later.</p>

<p>Looking forward to it. Call me anytime.</p>

<p>Reginald Foster<br/>Contracting Officer's Representative (COR)<br/>Department of Veterans Affairs<br/>(615) 555-0612</p>
`.trim(),
  },

  // ── Day 6 — Contracting Officer: VAAR 85% limitations on subcontracting ────
  {
    day: 6,
    slug: "sdvosb-limitations",
    senderKey: "contracting_officer",
    subject: "Compliance — VAAR 852.219-75 Limitations on Subcontracting (SDVOSB set-aside)",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>As the Contracting Officer I want your subcontracting plan on the right footing from day one. This contract was awarded to your firm as a <strong>Service-Disabled Veteran-Owned Small Business set-aside for general construction</strong>. Under <strong>VAAR 852.219-75</strong>:</p>

<ul>
  <li>Your firm may <strong>not pay more than 85%</strong> of the amount the government pays you to firms that are <strong>not</strong> certified SDVOSB/VOSB (verified in the SBA certification database). <em>Cost of materials is excluded.</em></li>
  <li>Work a similarly-situated SDVOSB/VOSB sub further subcontracts to a non-certified firm counts against the 85% cap.</li>
  <li>I will require a <strong>Certificate of Compliance</strong> and periodic subcontracting reports. A violation here is a matter within the jurisdiction of the United States (18 U.S.C. 1001) — I do not treat it lightly, and neither should you.</li>
</ul>

<p>Before you finalize buyout, show me a subcontracting plan that keeps you inside the cap — which certified firms you're using and/or how much you're self-performing. If your whole buyout goes to large non-certified subs, you have a compliance problem, not just a cost problem.</p>

<p>Karen Whitlock<br/>Contracting Officer, NCO 9<br/>Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
  },

  // ── Day 9 — Facilities: planned utility outage MOP for the UPS tie-in ──────
  {
    day: 9,
    slug: "utility-outage-mop",
    senderKey: "facilities",
    subject: "Building 626 electrical/UPS tie-in — you will need a planned outage (read this first)",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Bill Trainor, hospital engineering. Your scope ties new gear into the existing normal and emergency power in Building 626, and at some point you have to take a live bus down to do it. Here's how outages work in a hospital, because it is not how they work on a commercial job:</p>

<ul>
  <li>Every outage that touches a clinical load needs a written <strong>Method of Procedure (MOP)</strong> and a request submitted with <strong>at least six weeks' notice</strong> so we can notify the affected departments and stand up backup.</li>
  <li><strong>No daytime clinical outages.</strong> Realistically you're working a <strong>2 a.m. window</strong> with temporary power / generator backup and a hot standby to restore in minutes if anything goes sideways.</li>
  <li>Life-safety branch and any OR/ICU-adjacent load: expect me to require full redundancy before I sign.</li>
</ul>

<p>If your tie-in date shows up on my desk two weeks out with no MOP, the answer is no and your schedule takes the hit. Plan the outage backwards from a night window now.</p>

<p>Bill Trainor<br/>Chief, Facilities Management<br/>Nashville VA Medical Center<br/>(615) 555-0668</p>
`.trim(),
  },

  // ── Day 12 — A/E: submittal returns, slow turnaround, med-gas & fire alarm ─
  {
    day: 12,
    slug: "ae-submittal-returns",
    senderKey: "ae_architect",
    subject: "Submittal register — turnaround expectations & the packages I'll scrutinize",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Gerald Hoffman, A/E of record. A note on submittals so we don't develop friction. On VA work I review to the design intent and the VA standards, and I don't rubber-stamp — a few packages will take longer and I'd rather set that expectation now:</p>

<ul>
  <li><strong>Medical gas</strong> (source equipment, alarms, piping) and <strong>fire alarm</strong> — these get full review; budget extra cycle time and do not fabricate on a "no exceptions taken" you haven't received.</li>
  <li><strong>Nurse call / BMS integration</strong> — I'll want the points list and the integration approach, not just cut sheets.</li>
  <li>Send complete packages. An incomplete submittal comes back <em>Revise &amp; Resubmit</em>, and that round trip is on the schedule, not on me.</li>
</ul>

<p>Get me the register with your proposed dates and I'll tell you where I need more time. Where a package is on the critical path, flag it and I'll prioritize.</p>

<p>Gerald Hoffman, AIA<br/>Cumberland Healthcare Architects<br/>(615) 555-0521</p>
`.trim(),
  },

  // ── Day 16 — UPS/switchgear vendor: long lead + price hold ─────────────────
  {
    day: 16,
    slug: "vendor-ups-quote",
    senderKey: "ups_vendor",
    subject: "Healthcare-grade switchgear & UPS — 38-week lead, quote holds 30 days",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Thanks for the RFQ on the Building 626 critical power package — main switchgear, the paralleling gear for the emergency source, and the central UPS. Quote attached in summary:</p>

<ul>
  <li><strong>Package price: $612,000</strong>, firm for <strong>30 days</strong>.</li>
  <li><strong>Factory lead time: ~38 weeks</strong> from approved submittals — healthcare/EPSS-grade gear is not off the shelf, and the queue is long right now.</li>
  <li>I'm holding a production slot, but I can only hold it against a PO or a letter of intent. Once the 30-day window lapses I have to release both the price and the slot.</li>
</ul>

<p>Given a 38-week lead against your energization sequence, this is a release-now item. Get me a PO or an LOI inside the window and I'll lock the slot and start the submittal.</p>

<p>Curtis Bao<br/>Critical Power Sales Engineer, TriPower Critical Systems<br/>(678) 555-0322</p>
`.trim(),
  },

  // ── Day 20 — Accounting: Davis-Bacon certified payroll missing ─────────────
  {
    day: 20,
    slug: "certified-payroll-missing",
    senderKey: "accounting",
    subject: "Davis-Bacon — two subs' certified payrolls are missing; I can't certify the pay app",
    html: (ctx) =>
      `
<p>Hi ${ctx.pmFirst},</p>

<p>Accounting flag on the VA job. This is a Davis-Bacon prevailing-wage contract, so <strong>every</strong> sub (and us) must submit <strong>weekly certified payrolls (WH-347)</strong> with the Statement of Compliance — no exceptions, and no gaps in the weeks worked.</p>

<ul>
  <li><strong>Tennessee Abatement &amp; Demo</strong> and <strong>Volunteer Electric</strong> have crews on site but have submitted <strong>no certified payrolls</strong> for their first two weeks.</li>
  <li>I cannot include their work in the pay application to the VA without current, compliant payrolls — the CO's office spot-checks these and will withhold on a deficiency.</li>
  <li>If their classifications or rates don't match the wage determination (WDTN20230178 Mod 3), that's a restitution problem down the road.</li>
</ul>

<p>Can you lean on them to get the missing WH-347s in this week? Otherwise their line items come out of this month's billing and everyone's cash flow suffers.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
  },

  // ── Day 24 — Testing: firestopping / smoke-barrier failures above ceiling ──
  {
    day: 24,
    slug: "firestop-inspection-fail",
    senderKey: "testing_agency",
    subject: "Special inspection — firestop & smoke-barrier failures above the 2nd-floor corridor",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Marla Jennings, special inspections. Above-ceiling firestop inspection on the 2nd-floor corridor penetrations did not pass:</p>

<ul>
  <li>Several new cable and conduit penetrations through the <strong>smoke barrier</strong> are <strong>unsealed or sealed with a non-listed system</strong> — not per the tested UL assembly in the specs.</li>
  <li>This corridor is a <strong>required means of egress in an occupied wing</strong>, so an open smoke barrier is an <strong>Interim Life Safety Measures</strong> issue right now, not just a punch item.</li>
  <li>I've placed these on hold. They need correct listed firestop and re-inspection before the ceiling closes — and while the barrier is compromised, your ILSM plan should reflect it.</li>
</ul>

<p>Reply with your correction plan and re-inspection date. Photos of the failing penetrations attached in the report.</p>

<p>Marla Jennings<br/>Special Inspections Manager, Volunteer Testing &amp; Inspection<br/>(615) 555-0429</p>
`.trim(),
  },

  // ── Day 27 — A/E: medical gas certification (ASSE) gate ────────────────────
  {
    day: 27,
    slug: "medgas-certification",
    senderKey: "ae_architect",
    subject: "Medical gas — NFPA 99 verification & your installer's braze certs",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Flagging the medical-gas scope before it becomes a turnover problem. Under <strong>NFPA 99</strong>, the new med-gas piping in the renovated patient rooms cannot be placed in service until it passes <strong>third-party verification by an ASSE 6030 medical-gas verifier</strong> — independent of the installer.</p>

<ul>
  <li>Your plumbing sub's installers must hold current <strong>ASSE 6010</strong> med-gas brazing certifications; two of the certs your sub submitted appear to have <strong>expired</strong>. Uncertified brazing on med gas is a rip-out.</li>
  <li>Schedule the <strong>ASSE 6030 verifier</strong> early — they're booked out, and cross-connection or purity failures mean re-testing.</li>
  <li>Med gas gates <strong>occupancy</strong> of those rooms. It is squarely on the critical path to turning that wing back over to the hospital.</li>
</ul>

<p>Confirm the installer certs are current and that a verifier is lined up. This is one I don't want to discover at the finish line.</p>

<p>Gerald Hoffman, AIA<br/>Cumberland Healthcare Architects<br/>(615) 555-0521</p>
`.trim(),
  },

  // ── Day 30 — CO/COR: differing site condition (unforeseen asbestos) ────────
  {
    day: 30,
    slug: "differing-site-asbestos",
    senderKey: "cor",
    subject: "STOP — suspect asbestos above the 626 corridor ceiling (not in the survey)",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Your demo crew opened the ceiling in the 626 corridor and hit <strong>pipe insulation that looks like ACM</strong> — and it is <strong>not shown in the pre-bid asbestos survey</strong>. I've told your super to stop work in that area and rope it off. Now the part I need you to get right:</p>

<ul>
  <li>This is a potential <strong>differing site condition</strong>. Under the contract, you <strong>notify the Contracting Officer promptly and in writing</strong> and <strong>do not proceed</strong> with the changed work until directed.</li>
  <li>I know it's tempting to just have the abatement sub knock it out and keep moving — <strong>don't.</strong> I'm the COR; I <strong>cannot</strong> authorize the extra work or promise you'll be paid for it. If you self-help off my say-so, you're at risk of eating the cost and the time.</li>
  <li>To recover cost/time, you'll need to submit a <strong>Request for Equitable Adjustment (REA)</strong> to the CO with the survey gap documented.</li>
</ul>

<p>Get your written notice to Ms. Whitlock today and let's do this by the book so you actually get made whole.</p>

<p>Reginald Foster<br/>COR, Department of Veterans Affairs<br/>(615) 555-0612</p>
`.trim(),
  },

  // ── Day 34 — Facilities: an equipment-rental invoice to code/approve ───────
  {
    day: 34,
    slug: "negative-air-rental-invoice",
    senderKey: "accounting",
    subject: "Code & approve — negative-air/HEPA rental invoice (check the rate)",
    html: (ctx) =>
      `
<p>Hi ${ctx.pmFirst},</p>

<p>This equipment-rental invoice for the ICRA containment (negative-air machines and HEPA scrubbers) came in for your approval. Before I code it — please eyeball it against what you actually agreed to, because the monthly rate looks higher than the quote I have on file, and there's a line I don't recognize.</p>

${invoiceHtml({
  vendor: "RentPro Environmental",
  vendorAddress: "1420 Fesslers Ln, Nashville, TN",
  number: "RPE-44872",
  date: "current month",
  terms: "Net 30",
  lines: [
    { desc: "Negative-air machines / HEPA scrubbers — monthly (qty 8)", amount: 6_400.0 },
    { desc: "Delivery & setup", amount: 850.0 },
    { desc: "Damage waiver (14%)", amount: 896.0 },
    { desc: "After-hours service call — undocumented", amount: 1_250.0 },
  ],
})}

<p>Tell me what to do: approve as-is, or short-pay/dispute the pieces that don't match the agreement. I don't want to overpay on a containment rental that's going to run for months.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
  },

  // ── Day 40 — CO: constructive-change trap (verbal COR direction) ───────────
  {
    day: 40,
    slug: "verbal-direction-warning",
    senderKey: "contracting_officer",
    subject: "For the record — no work off verbal direction; changes come from me in writing",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>It got back to me that during a walk, my COR mentioned moving a wall in the 700 wing to "make the exam room work better," and that your crew may have started framing to it. I want to head off a problem before it costs you money.</p>

<ul>
  <li>My COR has <strong>no authority to change the work.</strong> A wall relocation not in the contract documents is a <strong>change</strong>, and only <strong>I</strong> can direct it — <strong>in writing</strong>, via a modification.</li>
  <li>If you built something off a verbal that turns out to be a change, you can pursue it as a <strong>constructive change</strong>, but the burden is on you to show it and it's a fight you may lose.</li>
  <li>Protect yourself: when anyone in the field gives you direction that isn't in the documents, <strong>get it in writing from me before you build it.</strong></li>
</ul>

<p>If you believe the wall move is warranted, submit it to me and I'll process a mod. Please confirm what's actually been built to date.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
  },

  // ── Day 46 — Owner/CO: ILSM fire watch when systems are impaired ───────────
  {
    day: 46,
    slug: "ilsm-fire-watch",
    senderKey: "facilities",
    subject: "Sprinkler impairment next week — ILSM fire watch is mandatory",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>Your tie-in work will take the sprinkler system in a section of the occupied wing out of service next week. In a hospital that triggers hard requirements — please build them into your plan and your cost:</p>

<ul>
  <li>Any time fire protection or fire alarm is <strong>impaired</strong> in an occupied area, a <strong>continuous fire watch</strong> is required per your ILSM plan — a dedicated person, documented rounds, for the full duration of the impairment.</li>
  <li>Notify me and the fire alarm monitoring in advance; minimize the impairment window; restore before you leave for the day if at all possible.</li>
  <li>Keep the smoke compartments intact — no propping fire/smoke doors, no leaving barriers open overnight.</li>
</ul>

<p>Send me the impairment plan and fire-watch coverage before you shut anything down.</p>

<p>Bill Trainor<br/>Chief, Facilities Management<br/>Nashville VA Medical Center<br/>(615) 555-0668</p>
`.trim(),
  },

  // ── Day 56 — Infection Control: clearance before turnover ──────────────────
  {
    day: 56,
    slug: "icra-clearance-turnover",
    senderKey: "infection_control",
    subject: "Turnover of the 700 wing — environmental clearance before I hand it back to patients",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>As you approach turnover of the renovated 700 wing, remember this space goes back into <strong>patient use</strong>, so it doesn't just need to be "done" — it needs to be <strong>clean to a clinical standard</strong> before I clear it:</p>

<ul>
  <li>Terminal cleaning, HEPA vacuuming above and below the ceiling, and a documented final wipe-down — construction dust cannot ride into an occupied clinic.</li>
  <li>I'll verify the <strong>containment comes down in the right sequence</strong> (clean egress, negative pressure maintained until the last dirty task is done).</li>
  <li>Confirm air balance / pressure relationships are correct for the room types (any AII/isolation or clean rooms verified) before I sign the clearance.</li>
</ul>

<p>Schedule the clearance walk with me and don't promise the hospital a move-in date until I've signed off. Nice work getting this wing to the finish — let's land it clean.</p>

<p>Diane Alvarado, RN, CIC<br/>Infection Preventionist, Nashville VA Medical Center<br/>(615) 555-0640</p>
`.trim(),
  },

  // ── Day 64 — CO: closeout / retainage under a federal contract ─────────────
  {
    day: 64,
    slug: "federal-closeout",
    senderKey: "contracting_officer",
    subject: "Closeout package & retainage release — what I need to make you final payment",
    html: (ctx) =>
      `
<p>${ctx.pmFirst},</p>

<p>As we head into closeout on 626–700, here's what my office needs before I release retainage and make final payment — start pulling it together now so we're not chasing it after substantial completion:</p>

<ul>
  <li>Complete <strong>O&amp;M manuals, as-builts, and warranties</strong>, plus VA-required <strong>commissioning</strong> and <strong>TAB</strong> reports and the <strong>medical-gas certification</strong>.</li>
  <li>Final <strong>certified payrolls</strong> reconciled with no open Davis-Bacon deficiencies, and your <strong>SDVOSB subcontracting compliance certificate</strong> for the completed work.</li>
  <li>Consent of surety, final release of claims, and punch complete with the COR's acceptance.</li>
</ul>

<p>Retainage on this contract is held per the contract terms and I release it against a complete closeout package — a clean one gets you paid fast. Let's finish strong.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
  },
];

/* ── Planted scenarios (gotcha traps + miss/handle ripples) ───────────────── */

export const HC_SCENARIOS: TrainingScenario[] = [
  {
    id: "hc-badging-lead",
    skill: "schedule",
    title: "Get workers through VA badging before mobilization",
    plantedDay: 2,
    deadlineDay: 12,
    threadSlugs: ["va-badging-roster"],
    topics: /badg|piv|background|credential|roster|va police|access|adjudicat/i,
    expectation:
      "Act on the 3–4 week badging lead time: submit worker rosters (starting with the first-to-mobilize subs) to VA Police early so crews aren't turned away at the gate on mobilization day.",
    handledKeywords: ["roster", "badge", "badging", "piv", "background", "submit", "credential"],
    consequence: {
      day: 20,
      senderKey: "va_police",
      subject: "Your demo & electrical crews were turned away — no badges on file",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>As I warned on day one, badging takes 3–4 weeks and I never received rosters early enough. This morning your <strong>abatement and electrical crews showed up to mobilize and I had to turn them away at the gate</strong> — no adjudicated background checks, no PIV credentials, no access.</p>

<p>They're in the queue now, but you've lost the better part of two weeks on your first two trades, and that's schedule you were counting on. I can escort a handful of people in the interim, but I can't run your job on escorts.</p>

<p>Get me every remaining roster today so we don't do this again on the next trade.</p>

<p>Marcus Hale<br/>VA Police — Credentialing &amp; PIV Badging<br/>(615) 555-0655</p>
`.trim(),
    },
    confirmation: {
      day: 20,
      senderKey: "va_police",
      subject: "Badges issued — your first crews are cleared for mobilization",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Because you got the rosters in early, your abatement and electrical crews are <strong>adjudicated and badged</strong> and cleared to mobilize on schedule. That early submission just saved you the two-week gate delay that catches most first-time VA contractors.</p>

<p>Keep feeding me rosters ahead of each trade's mobilization and we'll stay out in front of it.</p>

<p>Marcus Hale<br/>VA Police — Credentialing &amp; PIV Badging<br/>(615) 555-0655</p>
`.trim(),
    },
  },

  {
    id: "hc-icra-permit",
    skill: "field",
    title: "Get the ICRA permit before starting work in occupied areas",
    plantedDay: 3,
    deadlineDay: 14,
    threadSlugs: ["icra-permit-required"],
    topics: /icra|infection|containment|negative air|hepa|ilsm|barrier|permit|class iv/i,
    expectation:
      "Submit the ICRA + ILSM plan and secure a signed ICRA permit (Class IV containment, negative air/HEPA) before any demolition or above-ceiling work begins in or adjacent to occupied space.",
    handledKeywords: ["icra", "containment", "negative air", "hepa", "ilsm", "permit", "barrier", "submit"],
    consequence: {
      day: 22,
      senderKey: "infection_control",
      subject: "AREA SHUT DOWN — demolition started without an approved ICRA permit",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I walked the 626 corridor this morning and found your crew <strong>demolishing ceiling with no containment and no signed ICRA permit.</strong> Dust was migrating toward an occupied clinic. I <strong>shut the area down</strong> and I've filed an incident report to hospital leadership and your COR.</p>

<p>This is exactly what I told you I would not tolerate. Now you're stopped anyway — the area is red-tagged until you build proper Class IV containment, I verify it, and I sign the permit. You've lost the time <em>and</em> the goodwill, and infection control will be watching every barrier you build from here.</p>

<p>Diane Alvarado, RN, CIC<br/>Infection Preventionist, Nashville VA Medical Center<br/>(615) 555-0640</p>
`.trim(),
    },
    confirmation: {
      day: 22,
      senderKey: "infection_control",
      subject: "ICRA permit approved — you're cleared to work",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I walked your containment on the 626 corridor — hard barriers tight, negative air holding, anteroom and monitoring in place — and I've <strong>signed your Class IV ICRA permit.</strong> Your ILSM plan covers the egress impacts. You're cleared to work.</p>

<p>This is how it's supposed to go. Keep the barriers honest and give me a heads-up before you change the work area and we'll get through this renovation without an incident.</p>

<p>Diane Alvarado, RN, CIC<br/>Infection Preventionist, Nashville VA Medical Center<br/>(615) 555-0640</p>
`.trim(),
    },
  },

  {
    id: "hc-sdvosb-85",
    skill: "cost",
    title: "Stay inside the 85% subcontracting limit",
    plantedDay: 6,
    deadlineDay: 20,
    threadSlugs: ["sdvosb-limitations"],
    topics: /sdvosb|vosb|subcontract|85%|85 percent|limitation|set-aside|certif|self-perform|compliance/i,
    expectation:
      "Respond to the CO with a subcontracting-compliance plan that keeps the job inside the 85% cap — using certified SDVOSB/VOSB subs and/or committing enough self-performed work — rather than buying the big trades out to large non-certified firms.",
    handledKeywords: ["sdvosb", "vosb", "85", "self-perform", "certified", "compliance plan", "subcontracting plan"],
    consequence: {
      day: 30,
      senderKey: "contracting_officer",
      subject: "Compliance concern — your buyout appears to breach the 85% limitation",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I reviewed your SF-1413 and buyout to date. As I flagged in week one, this is an SDVOSB set-aside under VAAR 852.219-75, and your subcontracting <strong>appears to put well over 85% of the contract value with firms that are not certified SDVOSB/VOSB</strong> — with little self-performed work to offset it.</p>

<p>That is a compliance problem, not a paperwork one. I need a written cure: revise the subcontracting approach so you're demonstrably inside the cap, or show me the self-performance that gets you there. Until I have it, I'm withholding my compliance concurrence — and a knowing violation is a matter under 18 U.S.C. 1001.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
    },
    confirmation: {
      day: 30,
      senderKey: "contracting_officer",
      subject: "RE: Subcontracting compliance plan — accepted",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Thank you for the subcontracting-compliance plan. Between the certified SDVOSB/VOSB firms you've put on the major trades and the self-performed scope you've committed, you're demonstrably inside the 85% limitation, and your Certificate of Compliance is on file.</p>

<p>This is exactly the front-foot approach I want to see on a set-aside — you turned a compliance trap into a non-issue. Keep the subcontracting reports current as you finish buyout.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
    },
  },

  {
    id: "hc-utility-outage",
    skill: "schedule",
    title: "Submit the outage MOP with six weeks' notice",
    plantedDay: 9,
    deadlineDay: 24,
    threadSlugs: ["utility-outage-mop"],
    topics: /outage|shutdown|mop|method of procedure|tie-in|tie in|energiz|redundan|night window|2 a\.?m/i,
    expectation:
      "Plan the 626 electrical/UPS tie-in backwards from a night window: submit a written Method of Procedure and the outage request with the required ~6 weeks' notice, including temporary power / redundancy, so Facilities can approve it.",
    handledKeywords: ["mop", "method of procedure", "outage", "six week", "6 week", "night", "redundan", "temporary power"],
    consequence: {
      day: 42,
      senderKey: "facilities",
      subject: "Outage denied — you gave me two weeks' notice and no MOP",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Your requested tie-in outage lands in twelve days and I just got the request — with <strong>no Method of Procedure and nowhere near the six weeks' notice</strong> I need to notify the clinical departments and stand up backup. I can't take a live clinical bus down on that. <strong>The answer is no</strong> for the date you wanted.</p>

<p>The next viable night window with proper notice pushes your tie-in out several weeks, and your electrical sequence stalls behind it. This was avoidable — I laid out exactly how outages work here back in week two.</p>

<p>Get me a real MOP and let's find the next window.</p>

<p>Bill Trainor<br/>Chief, Facilities Management<br/>Nashville VA Medical Center<br/>(615) 555-0668</p>
`.trim(),
    },
    confirmation: {
      day: 42,
      senderKey: "facilities",
      subject: "Outage approved — 2 a.m. window locked for the 626 tie-in",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>Your MOP was thorough — temporary power, hot standby, department notifications, restoration plan — so I've <strong>approved the tie-in for a 2 a.m. window</strong> and notified the affected clinics. Because you gave me the notice and the plan, we can do this without risking patient care.</p>

<p>Run it exactly as the MOP reads and keep me on the phone that night. Good work getting ahead of it.</p>

<p>Bill Trainor<br/>Chief, Facilities Management<br/>Nashville VA Medical Center<br/>(615) 555-0668</p>
`.trim(),
    },
  },

  {
    id: "hc-certified-payroll",
    skill: "cost",
    title: "Get the missing certified payrolls in",
    plantedDay: 20,
    deadlineDay: 30,
    threadSlugs: ["certified-payroll-missing"],
    topics: /certified payroll|davis.?bacon|wh.?347|prevailing wage|payroll|wage determination|statement of compliance/i,
    expectation:
      "Chase the two subs for their missing weekly WH-347 certified payrolls (and fix any classification/rate issues) so the pay application can be certified to the VA without a Davis-Bacon deficiency or withholding.",
    handledKeywords: ["wh-347", "certified payroll", "davis-bacon", "payroll", "prevailing wage", "compliance"],
    consequence: {
      day: 40,
      senderKey: "accounting",
      subject: "VA withheld on the pay app — Davis-Bacon payroll deficiency",
      html: (ctx) =>
        `
<p>Hi ${ctx.pmFirst},</p>

<p>The missing certified payrolls never came, and it caught up with us. The CO's office <strong>spot-checked and withheld</strong> on this month's pay application over the Davis-Bacon deficiency, and on review the abatement sub's laborer <strong>classification doesn't match the wage determination</strong> — so now we're looking at potential <strong>back-wage restitution</strong>, not just a late form.</p>

<p>Both subs' work is out of this month's billing, cash flow is tight, and we have a compliance file open with the VA that we have to clear. Please get every outstanding WH-347 in and let's sort the classification before it grows.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
    },
    confirmation: {
      day: 40,
      senderKey: "accounting",
      subject: "Payrolls current — pay app certified and out the door",
      html: (ctx) =>
        `
<p>Hi ${ctx.pmFirst},</p>

<p>All the outstanding WH-347s are in, classifications match the wage determination, and I was able to <strong>certify the pay application to the VA with no Davis-Bacon deficiency.</strong> The subs' work is billed and payments will flow on time.</p>

<p>Thanks for leaning on them — staying current on certified payroll is one of those things that's invisible when it's right and a nightmare when it's not. Nice job keeping us clean.</p>

<p>Janet Kim<br/>Accounting Manager</p>
`.trim(),
    },
  },

  {
    id: "hc-differing-site",
    skill: "comms",
    title: "Handle the unforeseen asbestos as a differing site condition",
    plantedDay: 30,
    deadlineDay: 40,
    threadSlugs: ["differing-site-asbestos"],
    topics: /asbestos|acm|differing site|dsc|rea|equitable adjustment|stop work|survey|notify the co|in writing/i,
    expectation:
      "Treat the unforeseen asbestos as a differing site condition: keep work stopped in the area, notify the Contracting Officer promptly in writing, and pursue an REA — do NOT self-help off the COR's verbal say-so.",
    handledKeywords: ["differing site", "rea", "equitable adjustment", "notify", "in writing", "contracting officer", "stop work", "asbestos"],
    consequence: {
      day: 48,
      senderKey: "contracting_officer",
      subject: "Denied — you abated without direction and outside the changes process",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I've received your request for additional cost and time on the corridor asbestos. The problem: you had the material <strong>abated and kept building without written direction from me</strong> and without proper notice of a differing site condition — apparently off a conversation with the COR, who has no authority to direct changed work.</p>

<p>Because you proceeded outside the Changes and Differing Site Conditions process, your ability to recover is seriously compromised. I can consider a constructive-change argument, but you've put the burden on yourself and weakened your own position. This is the exact trap I warned you about.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
    },
    confirmation: {
      day: 48,
      senderKey: "contracting_officer",
      subject: "REA received — you did this one right",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>I have your written notice of the differing site condition and your REA for the unforeseen asbestos, with the pre-bid survey gap documented. Because you stopped, notified me promptly in writing, and waited for direction instead of self-helping, your entitlement is clean — I'm directing the abatement by modification and we'll negotiate the equitable adjustment for the added cost and time.</p>

<p>That's textbook handling of a differing site condition on a federal job. It's the difference between getting made whole and eating it.</p>

<p>Karen Whitlock<br/>Contracting Officer, Department of Veterans Affairs<br/>(615) 555-0600</p>
`.trim(),
    },
  },

  {
    id: "hc-medgas-cert",
    skill: "submittals",
    title: "Line up medical-gas certification (ASSE) before turnover",
    plantedDay: 27,
    deadlineDay: 42,
    threadSlugs: ["medgas-certification"],
    topics: /med(ical)? gas|nfpa 99|asse|6010|6030|braze|verifier|purity|cross.?connect/i,
    expectation:
      "Protect med-gas turnover: confirm the plumbing sub's ASSE 6010 braze certs are current and schedule an independent ASSE 6030 verifier early, so the med-gas system passes NFPA 99 verification and doesn't gate occupancy.",
    handledKeywords: ["asse", "6030", "6010", "med gas", "medical gas", "verifier", "nfpa 99", "braze"],
    consequence: {
      day: 56,
      senderKey: "ae_architect",
      subject: "Med gas failed verification — that wing can't be occupied",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The medical-gas system in the renovated patient rooms <strong>failed third-party verification.</strong> The verifier was booked weeks out by the time anyone called, and when they did test, they found a <strong>cross-connection</strong> and brazing by an installer whose <strong>ASSE 6010 cert had lapsed</strong> — so portions have to be re-done and re-verified.</p>

<p>Until it passes, those rooms <strong>cannot be turned over for patient use</strong>, and that's now on your critical path to occupancy. This is precisely the finish-line surprise I flagged back in week four.</p>

<p>Gerald Hoffman, AIA<br/>Cumberland Healthcare Architects<br/>(615) 555-0521</p>
`.trim(),
    },
    confirmation: {
      day: 56,
      senderKey: "ae_architect",
      subject: "Med gas certified — cleared for occupancy",
      html: (ctx) =>
        `
<p>${ctx.pmFirst},</p>

<p>The medical-gas system <strong>passed ASSE 6030 verification</strong> — purity, cross-connection, and alarms all good, installer certs current. Because you scheduled the verifier early and stayed on the braze certifications, there's no re-work and no schedule hit, and those patient rooms are cleared for occupancy.</p>

<p>Med gas is where sloppy jobs get caught at the finish line. Yours didn't. Well done.</p>

<p>Gerald Hoffman, AIA<br/>Cumberland Healthcare Architects<br/>(615) 555-0521</p>
`.trim(),
    },
  },
];

/* ── Interactive meetings (VA cast — different personalities) ─────────────── */

/** Day-1 precon short-list team for the VA job — a distinct cast from the
 *  default job's precon room, with a federal/healthcare lens. */
const HC_BID_SPEAKERS: MeetingSpeaker[] = [
  {
    key: "diaz",
    name: "Warren Diaz",
    title: "Director of Preconstruction",
    style:
      "Runs the meeting. Calm, methodical federal-work veteran; moves through the agenda, summarizes decisions, and steers tangents back. Has run a lot of VA jobs and it shows.",
  },
  {
    key: "brooks",
    name: "Nadia Brooks",
    title: "Senior Estimator",
    style:
      "Owns the numbers and the bid tab. Fast and exact with figures, exclusions, and scope gaps. Blunt when a low number is hiding a hole. Tracks which bidders are SDVOSB/VOSB-certified.",
  },
  {
    key: "yamamoto",
    name: "Curtis Yamamoto",
    title: "VP, Federal & Healthcare Group",
    style:
      "The compliance-and-risk brain. Cares about the SDVOSB 85% limitation, hospital constraints (ICRA, med gas, badging), and schedule risk on long-lead gear. Speaks less but weighs in hard on award strategy and pushes for a decision.",
  },
];

const HC_BID_REVIEW_MEETING: TrainingMeeting = {
  id: "hc-pm-day1-bid-review",
  role: "project_manager",
  day: 1,
  taskMatch:
    "Meet with preconstruction team to review bid results and develop short-list of vendors by trade",
  title: "Bid Review & Vendor Short-List — VA 626-700",
  objective:
    "Walk the bid results with the preconstruction team and agree on a short-list by trade — while protecting the SDVOSB 85% compliance posture, the hospital constraints, and the long-lead critical power.",
  deliverable: "Bid tab / vendor short-list + compliance strategy",
  speakers: HC_BID_SPEAKERS,
  facts: `VA 626-700 BID TAB (firm-fixed-price, SDVOSB set-aside; contract value ~$34.5M):
Selective Demolition & Abatement (est. $2.0M): Tennessee Abatement & Demo (SDVOSB) $1,950,000 — clean, holds the ICRA/abatement scope; competitor Delta Demo $1,910,000 (NOT SDVOSB; excludes ACM contingency).
Electrical / Normal & Emergency Power (est. $7.8M): Volunteer Electric (SDVOSB) $7,600,000 — carries switchgear/UPS at ~38-week lead per TriPower quote; competitor Statewide Electric $7,410,000 (NOT SDVOSB, large firm).
Mechanical / HVAC & HEPA (est. $6.5M): Highland Mechanical Systems $6,400,000 (NOT SDVOSB) — flagged HEPA/AHU long lead; competitor Ridgeline Mechanical $6,720,000.
Plumbing & Medical Gas (est. $4.0M): Cumberland Plumbing & Med-Gas $3,850,000 — MUST hold current ASSE 6010 med-gas braze certs; one competitor's med-gas exclusions are a red flag.
Fire Protection / Sprinkler (est. $1.5M): Guardian Fire Protection (VOSB) $1,480,000 — clean; ILSM-aware.
Low Voltage / Nurse Call & BMS (est. $2.2M): Signal Point Technologies $2,150,000 — nurse-call + BMS integration scope; wants the points list.
Drywall / ACT / Finishes (est. $3.0M): Music City Interiors $2,900,000.
Resilient Flooring / Sheet Vinyl (est. $1.35M): Southeast Surfaces $1,320,000.
COMPLIANCE MATH: If the two biggest trades (electrical, mechanical) both go to the lowest NON-certified competitors, non-SDVOSB dollars blow past the 85% cap unless self-performance or certified subs offset it.
LONG LEAD: critical power (switchgear/UPS) ~38 weeks, 30-day price hold; HEPA/AHUs long.
HOSPITAL CONSTRAINTS the awards must respect: ICRA containment (demo), VA badging lead on first crews, med-gas ASSE certification, planned-outage MOP for the tie-in.`,
  agenda: [
    {
      title: "Coverage, results & the compliance picture",
      points: [
        "All eight trades received bids; coverage is decent.",
        "Two structural issues to keep front of mind: this is an SDVOSB set-aside with an 85% limitation on subcontracting, and the two biggest trades (electrical, mechanical) have non-certified low bidders.",
        "Curtis' point: if we chase the lowest number on every big trade to non-certified firms, we breach the 85% cap — the award strategy has to solve compliance, not just cost.",
      ],
    },
    {
      title: "Infrastructure & critical trades (demo/abatement, electrical, mechanical)",
      points: [
        "Demo/Abatement: Tennessee Abatement (SDVOSB) is $40k over a non-certified competitor but holds the ICRA/ACM scope clean — and being SDVOSB helps the 85% math.",
        "Electrical: Volunteer Electric (SDVOSB) carries switchgear/UPS at ~38-week lead; Statewide is $190k lower but not certified — awarding it dumps a huge non-certified dollar figure into the cap.",
        "Mechanical: Highland (non-certified) is low and flagged HEPA/AHU long lead; there's no SDVOSB mechanical bidder, so this trade is where self-performance or offset matters.",
      ],
    },
    {
      title: "Systems & finishes (plumbing/med-gas, fire, low voltage, finishes, flooring)",
      points: [
        "Plumbing & Med-Gas: Cumberland is low and clean — but the award must condition on current ASSE 6010 braze certs and an ASSE 6030 verifier plan; a competitor excluded med-gas verification entirely.",
        "Fire Protection: Guardian (VOSB) is low and ILSM-aware — clean pick that also helps compliance.",
        "Low voltage / nurse call / BMS, drywall/finishes, flooring: numbers are tight; standard scope calls.",
      ],
    },
    {
      title: "Short-list decisions & compliance strategy",
      points: [
        "Go trade by trade and have the PM confirm the short-list.",
        "Team recommendation leans on the certified firms for the big dollars (Volunteer Electric, Tennessee Abatement, Guardian Fire) plus a defined self-performance scope to keep non-certified spend under 85%.",
        "The PM owns the final call; the team pushes back if a pick creates a compliance or hospital-constraint problem.",
      ],
    },
    {
      title: "Action items & award targets",
      points: [
        "PM to build the SDVOSB subcontracting-compliance plan for the CO before finalizing buyout.",
        "Release the critical-power (switchgear/UPS) package early — 38-week lead, 30-day price hold.",
        "Condition the plumbing award on med-gas certification; get first-crew (demo, electrical) badging rosters moving immediately.",
        "Target: awards and the compliance plan out by end of next week; the bid tab / short-list is the deliverable.",
      ],
    },
  ],
  checkpoints: [
    {
      id: "hc-85-compliance",
      title: "85% subcontracting compliance",
      expectation:
        "Catches that awarding the biggest trades to non-certified low bidders breaches the SDVOSB 85% cap, and steers the short-list toward certified firms / self-performance to stay compliant.",
      plant:
        "During coverage and the electrical/mechanical discussion, have Curtis Yamamoto raise IN PASSING that awarding both big trades to the non-certified competitors would push non-SDVOSB spend past the 85% limitation — state the risk factually and let the PM decide the strategy. Don't solve it for them.",
      plantAgendaIndex: 0,
      fallbackLine:
        "Curtis flagged that if electrical and mechanical both go to the non-certified low bidders, we blow past the 85% subcontracting limitation unless we lean on certified firms or self-perform.",
      keywords: ["85", "sdvosb", "vosb", "certified", "self-perform", "limitation", "compliance"],
    },
    {
      id: "hc-critical-power-lead",
      title: "Critical power long-lead release",
      expectation:
        "Flags the ~38-week switchgear/UPS lead and calls for an early electrical award / LOI / early release to protect energization.",
      plant:
        "The bid tab carries Volunteer Electric's ~38-week critical-power lead and the 30-day price hold. Mention it with the electrical numbers; don't propose the early release yourselves.",
      plantAgendaIndex: 1,
      keywords: ["switchgear", "ups", "loi", "early release", "long lead", "long-lead", "38"],
    },
    {
      id: "hc-medgas-cert",
      title: "Med-gas ASSE certification condition",
      expectation:
        "Doesn't take the plumbing low bid at face value — conditions the award on current ASSE 6010 braze certs and an ASSE 6030 verification plan.",
      plant:
        "The bid tab notes med-gas certification requirements and a competitor's med-gas exclusion. Present it factually; let the PM make it a condition of award.",
      plantAgendaIndex: 2,
      keywords: ["asse", "med gas", "medical gas", "6010", "6030", "verif", "braze"],
    },
    {
      id: "hc-badging-mobilization",
      title: "VA badging lead on first crews",
      expectation:
        "Connects the 3–4 week VA badging lead to the award sequence — gets rosters for demo/electrical moving immediately so mobilization isn't stranded at the gate.",
      plant:
        "During action items, have Warren Diaz mention that first-crew badging runs 3–4 weeks at this campus. Drop it as a logistics note; let the PM turn it into an action.",
      plantAgendaIndex: 4,
      fallbackLine:
        "Warren reminded the room that VA badging runs 3–4 weeks, so demo and electrical rosters need to go in the day we award, not the day we mobilize.",
      keywords: ["badg", "roster", "piv", "background", "mobiliz", "credential"],
    },
  ],
  opening: [
    {
      speaker: "diaz",
      text: "Thanks for making time on day one — on a VA job this hour matters even more than usual. Purpose is simple: walk the bids trade by trade and leave with a short-list, but on this one the short-list has to solve three things at once — cost, the SDVOSB 85% compliance picture, and the hospital constraints. Agenda: coverage and compliance, the infrastructure trades, systems and finishes, short-list decisions, then action items. Nadia, start us on coverage.",
    },
    {
      speaker: "brooks",
      text: "We got bids on all eight trades. Numbers are close to estimate in aggregate. The thing I want everyone holding in their head as we go: our two biggest trades — electrical and mechanical — have non-certified low bidders, and this is an SDVOSB set-aside. So \"lowest number\" and \"can we actually award it\" aren't the same question here.",
    },
    {
      speaker: "yamamoto",
      text: "Right — and that's my flag for the whole meeting. Under the 85% limitation we can't pay more than 85 percent of the contract to non-certified firms. If we chase the cheapest number on every big trade, we breach that. So as we short-list, keep asking: does this keep us compliant, or does it dig the hole deeper?",
    },
    {
      speaker: "diaz",
      text: "Well put. Before we get into the trades — anything on how the bids came in you want us to spend extra time on, or any trade you're most worried about?",
    },
  ],
};

/** Shared VA cast for the progress meetings — the CO and COR (matching their
 *  inbox personas). Different personalities from the default job's OAC. */
const HC_PROGRESS_SPEAKERS: MeetingSpeaker[] = [
  {
    key: "whitlock",
    name: "Karen Whitlock",
    title: "Contracting Officer (VA)",
    style:
      "Runs the progress meeting as the government's authority. Formal, precise, procedural — cares about contract compliance, schedule, and documentation. Cites the contract and the changes process. Polite but unbending; unimpressed by verbal assurances and 'we'll handle it' — she wants it in writing.",
  },
  {
    key: "foster",
    name: "Reginald Foster",
    title: "Contracting Officer's Representative (COR)",
    style:
      "The day-to-day VA rep. Collegial, knows the site and the hospital's pain points, genuinely helpful — but careful to stay in his lane ('that's a CO decision, not mine'). Raises field and coordination issues and quietly notes when the PM should already know something.",
  },
];

const HC_WALK_TIME_LIMIT = 30;

const HC_PROGRESS_DAY30: TrainingMeeting = {
  id: "hc-pm-day30-oac",
  role: "project_manager",
  day: 30,
  taskMatch:
    "Run the monthly OAC meeting and walk the site with the owner and architect",
  title: "Monthly Progress Meeting & Site Walk — Month 1 (VA)",
  objective:
    "Give the Contracting Officer and COR a straight status picture — schedule, compliance, and open items — then walk the hospital and answer their questions on the spot.",
  deliverable: "Progress meeting minutes + action items",
  speakers: HC_PROGRESS_SPEAKERS,
  facts: `VA 626-700 STATUS SNAPSHOT (Month 1):
- ICRA containment up in the 626 corridor; demolition/abatement underway inside Class IV barriers.
- Long-lead: critical power (switchgear/UPS) ~38-week lead — early release status matters. HEPA/AHUs long.
- Compliance posture: SDVOSB 85% subcontracting-compliance plan is the CO's live concern; certified payroll (WH-347) must be current for every sub.
- Badging: first crews cleared via VA PIV; later trades' rosters must keep flowing.
- Facilities: the 626 electrical/UPS tie-in needs a planned-outage MOP with ~6 weeks' notice, night window, redundancy.
- Any unforeseen conditions (e.g. suspect ACM above ceilings) go through the CO in writing as a differing site condition / REA — not verbal COR direction.
- Substantial completion date unchanged so far; the CO does not tolerate surprises or work off verbal direction.`,
  agenda: [
    {
      title: "Schedule, milestones & long-lead",
      points: [
        "Demo/abatement is underway inside ICRA containment; the CO wants the schedule statement and whether substantial completion still holds.",
        "Critical-power procurement (switchgear/UPS, ~38-week lead) is the item the CO has heard about — she wants its release status on record.",
        "Foster will note field/coordination items; badging flow for upcoming trades.",
      ],
    },
    {
      title: "Compliance — SDVOSB 85% & certified payroll",
      points: [
        "The CO wants the SDVOSB subcontracting-compliance plan walked: certified firms, self-performance, and where the non-certified spend sits against the 85% cap.",
        "Certified payroll (WH-347) status: any gaps are a Davis-Bacon problem she will withhold on.",
        "Her standing rule: compliance is not paperwork — she wants it demonstrably in hand, in writing.",
      ],
    },
    {
      title: "Open items, outages & 30-day look-ahead",
      points: [
        "The planned-outage MOP for the 626 tie-in: is it submitted with proper notice?",
        "ICRA/ILSM status and any inspection items in occupied areas.",
        "Once open items are covered, the group walks the site — hard hats and ICRA anteroom protocol; the walk is part of this meeting.",
      ],
    },
  ],
  checkpoints: [
    {
      id: "hc-oac30-compliance",
      title: "SDVOSB compliance + certified payroll on record",
      expectation:
        "When compliance comes up, proactively speaks to the 85% subcontracting posture and certified-payroll currency — without the CO having to drag it out — and commits to it in writing.",
      plant:
        "During the compliance agenda item, have Karen Whitlock ask generally how the PM is 'keeping the contract compliant' without naming the 85% rule or certified payroll herself at first. Whether the PM surfaces both unprompted is the test; if not, she asks pointedly and is visibly unimpressed.",
      plantAgendaIndex: 1,
      keywords: ["85", "sdvosb", "certified payroll", "wh-347", "self-perform", "compliance plan"],
    },
  ],
  opening: [
    {
      speaker: "whitlock",
      text: "Good morning. Standing agenda: schedule and long-lead, then compliance, then open items and the thirty-day look-ahead, then we walk the space. Let's start with schedule — give me the status picture and your top risk, in your own words. And I'll want the critical-power release status specifically.",
    },
    {
      speaker: "foster",
      text: "Morning. I'll add a couple of field items when we get to open items — badging for the next trades and the tie-in outage. But go ahead, schedule first.",
    },
  ],
  walk: {
    intro: {
      speaker: "whitlock",
      text: "(Standing) We'll walk the work area — hard hats, and we badge through and follow the ICRA anteroom protocol; I expect you to lead that correctly. As we go, the COR and I will ask you questions. You're the PM; have the answer, or tell me exactly where it lives and when I'll have it. 'We'll look into it' is not an answer I accept.",
    },
    timeLimitSeconds: HC_WALK_TIME_LIMIT,
    questions: [
      {
        id: "hc30-critical-power",
        speakerKey: "whitlock",
        title: "Critical power delivery",
        ask: "(At the future electrical room — bare walls, conduit stubs) This is the room the whole energization sequence hinges on. When does the switchgear and UPS actually arrive, and what happens to my schedule if it slips?",
        fullAnswer:
          "States the delivery window tied to the release / approved submittals (~38-week lead) and a contingency — temporary power, the planned-outage sequencing — if it slips.",
        sourceHint:
          "The procurement log and TriPower's quote/order confirmation (critical-power vendor thread) — offer to confirm the current factory date after the walk.",
        skill: "schedule",
        fullKeywords: ["38", "week", "lead", "ups", "switchgear", "temporary power", "temp power", "energiz"],
        sourceKeywords: ["procurement log", "vendor", "quote", "confirm", "order confirmation", "tripower", "after the walk"],
      },
      {
        id: "hc30-icra-containment",
        speakerKey: "foster",
        title: "ICRA containment status",
        ask: "(At the containment barrier, negative-air unit humming) Walk me through this containment — what ICRA class is it, and how are you proving the negative pressure is holding day to day?",
        fullAnswer:
          "Names the Class IV precaution, describes hard barriers + negative air/HEPA + anteroom, and the daily monitoring/log that documents the pressure differential — and that Infection Control signed the permit.",
        sourceHint:
          "The approved ICRA permit and the daily containment monitoring log — offer to send the permit and the latest readings.",
        skill: "field",
        fullKeywords: ["class iv", "negative", "hepa", "anteroom", "monitor", "pressure", "log", "permit"],
        sourceKeywords: ["icra permit", "monitoring log", "infection control", "send you", "readings"],
      },
      {
        id: "hc30-compliance-plan",
        speakerKey: "whitlock",
        title: "85% compliance status",
        ask: "(Walking the corridor) My file needs this on the record: how are you keeping this buyout inside the 85% subcontracting limitation, and is your certified payroll current?",
        fullAnswer:
          "Gives a direct answer — which certified SDVOSB/VOSB firms carry the big trades and/or the self-performed scope keeping non-certified spend under the cap — and confirms WH-347 certified payrolls are current.",
        sourceHint:
          "The SDVOSB subcontracting-compliance plan / SF-1413 and the certified-payroll file — commit to sending the current compliance report.",
        skill: "cost",
        fullKeywords: ["85", "sdvosb", "vosb", "certified", "self-perform", "wh-347", "certified payroll"],
        sourceKeywords: ["compliance plan", "sf-1413", "subcontracting report", "send you", "payroll file"],
      },
      {
        id: "hc30-outage-mop",
        speakerKey: "foster",
        title: "Tie-in outage plan",
        ask: "(By the existing electrical panel) The tie-in means taking a live bus down. What's your plan for the outage, and has Facilities got what they need to approve it?",
        fullAnswer:
          "Knows the outage requires a written MOP submitted with ~6 weeks' notice, a night window, and redundancy/temporary power, and states where that request stands with Facilities.",
        sourceHint:
          "The Method of Procedure and the outage request to Facilities — offer to forward the MOP and the requested window.",
        skill: "schedule",
        fullKeywords: ["mop", "method of procedure", "six week", "6 week", "night", "2 a.m", "redundan", "temporary power"],
        sourceKeywords: ["facilities", "outage request", "mop", "forward", "submitted"],
      },
    ],
    outro: {
      speaker: "whitlock",
      text: "(Back at the trailer) Adequate walk. I want the minutes with action items and owners by tomorrow, and the compliance report and MOP status in writing this week. Same time next month. Adjourned.",
    },
  },
};

const HC_PROGRESS_DAY60: TrainingMeeting = {
  id: "hc-pm-day60-oac",
  role: "project_manager",
  day: 60,
  taskMatch:
    "Run the monthly OAC meeting and walk the site with the owner and architect",
  title: "Monthly Progress Meeting & Site Walk — Month 2 (VA)",
  objective:
    "Status the CO and COR through the finishes/turnover push — schedule to substantial completion, billing/compliance integrity, and the occupancy-critical chain — then answer their questions on the walk.",
  deliverable: "Progress meeting minutes + action items",
  speakers: HC_PROGRESS_SPEAKERS,
  facts: `VA 626-700 STATUS SNAPSHOT (Month 2):
- Finishes underway in the 700 wing; MEP trim, nurse-call/BMS, and controls in progress.
- Occupancy-critical chain: medical-gas ASSE 6030 verification, fire alarm / ILSM acceptance, Infection Control environmental clearance, then turnover to the hospital.
- Billing/compliance: certified payroll must stay current (a prior gap risked a Davis-Bacon withholding); pay-app billed-vs-installed must be honest; SDVOSB subcontracting report current.
- A differing site condition (unforeseen ACM above the 626 corridor) is being handled through the CO by REA — not verbal direction.
- Firestop/smoke-barrier corrections in occupied corridors are an ILSM item until re-inspected.
- Retainage released against a complete federal closeout package; the CO hates surprises and work off verbal direction.`,
  agenda: [
    {
      title: "Schedule to substantial completion",
      points: [
        "Finishes and MEP trim are running; the conversation is the runway to substantial completion and turnover of the 700 wing.",
        "The CO wants the PM's plain commitment on the date and the gating items: med-gas verification, fire/ILSM acceptance, Infection Control clearance.",
        "Foster will want the finishes sequence and any resubmittals that could stall a floor.",
      ],
    },
    {
      title: "Billing integrity & compliance",
      points: [
        "Pay-application accuracy: billed-vs-installed on the big trades, and no Davis-Bacon certified-payroll gaps.",
        "SDVOSB subcontracting report current; the differing-site-condition REA status.",
        "The CO's rule stands: everything demonstrable and in writing.",
      ],
    },
    {
      title: "Occupancy chain & closeout look-ahead",
      points: [
        "Med-gas ASSE 6030 verification, fire alarm/ILSM acceptance testing, Infection Control environmental clearance, then turnover.",
        "Federal closeout package: O&M/as-builts/warranties, commissioning/TAB, final certified payrolls, consent of surety, release of claims.",
        "Once the look-ahead is covered, the group walks the wing — hard hats and ICRA protocol; the walk is part of this meeting.",
      ],
    },
  ],
  checkpoints: [
    {
      id: "hc-oac60-billing-integrity",
      title: "Billed-vs-installed & compliance honesty",
      expectation:
        "When billing comes up, owns pay-app accuracy (front-loaded billing cut to installed reality) AND confirms certified payroll and SDVOSB reporting are current — rather than glossing it.",
      plant:
        "During the billing/compliance item, have Karen Whitlock say her office 'may spot-check the pay app against installed work and the payroll file' without naming a specific trade. Whether the PM owns billed-vs-installed discipline and confirms payroll/SDVOSB currency is the test; don't resolve it for them.",
      plantAgendaIndex: 1,
      fallbackLine:
        "Karen noted her office may spot-check this pay application against installed quantities and the certified-payroll file, and asked how billing is being verified.",
      keywords: ["installed", "billed", "certified payroll", "wh-347", "sdvosb", "earned", "cut"],
    },
  ],
  opening: [
    {
      speaker: "whitlock",
      text: "Morning. We're in the last stretch on the 700 wing, so today I care about three things: the runway to substantial completion, whether your billing and compliance match reality, and the occupancy chain — med gas, fire/ILSM acceptance, infection-control clearance. Then we walk it. Start with schedule: where are we, honestly, and what's gating turnover?",
    },
    {
      speaker: "foster",
      text: "Morning. When we get to open items I want to talk resubmittals and the med-gas verification schedule — those are the things I see stalling this from the field. But schedule first.",
    },
  ],
  walk: {
    intro: {
      speaker: "whitlock",
      text: "(Standing) Hard hats — and we're going into space that's nearly patient-ready, so follow the clean protocol. Same rules: I ask, you answer, or you tell me exactly where it lives and when I'll have it. Ready.",
    },
    timeLimitSeconds: HC_WALK_TIME_LIMIT,
    questions: [
      {
        id: "hc60-medgas-status",
        speakerKey: "whitlock",
        title: "Med-gas verification & occupancy",
        ask: "(In a finished patient room, med-gas outlets in the headwall) These rooms can't take patients until the med gas is certified. When does the ASSE verification happen, and is your installer's certification in order?",
        fullAnswer:
          "Knows the sequence — installer ASSE 6010 certs current, independent ASSE 6030 verifier scheduled, NFPA 99 testing — states the window, and ties it to the occupancy date.",
        sourceHint:
          "The med-gas submittal / installer cert record and the verifier's scheduled date — offer to confirm the verification slot after the walk.",
        skill: "submittals",
        fullKeywords: ["asse", "6030", "6010", "verif", "nfpa 99", "med gas", "medical gas", "braze"],
        sourceKeywords: ["submittal", "cert", "verifier", "schedule", "confirm", "after the walk"],
      },
      {
        id: "hc60-firestop-ilsm",
        speakerKey: "foster",
        title: "Firestop / smoke barrier",
        ask: "(Looking up at an open ceiling at a corridor penetration) Hold on — those penetrations through the smoke barrier: are they firestopped to the listed assembly, and how are you covering ILSM while this is open?",
        fullAnswer:
          "Owns it as an ILSM item: correct listed firestop per the tested UL assembly, re-inspection before the ceiling closes, and fire-watch/ILSM measures while the barrier is compromised.",
        sourceHint:
          "The firestop spec / listed UL assemblies and the special-inspection report + the ILSM plan — commit to the correction and re-inspection date.",
        skill: "field",
        fullKeywords: ["firestop", "listed", "ul", "smoke barrier", "ilsm", "fire watch", "re-inspect"],
        sourceKeywords: ["spec", "inspection report", "ilsm plan", "re-inspection", "listed assembly"],
      },
      {
        id: "hc60-billing-installed",
        speakerKey: "whitlock",
        title: "Billed vs installed",
        ask: "(Stopping in a corridor) Straight question for the record: does this month's pay application match what's actually installed here, and is every sub's certified payroll current?",
        fullAnswer:
          "Confirms pay-app billing is cut to installed reality (no front-loading), and that all WH-347 certified payrolls are current with no Davis-Bacon deficiency.",
        sourceHint:
          "The schedule of values / pay-app backup and the certified-payroll file — offer to send the billed-vs-installed reconciliation and payroll status.",
        skill: "cost",
        fullKeywords: ["installed", "earned", "not front", "certified payroll", "wh-347", "current", "cut"],
        sourceKeywords: ["schedule of values", "pay app backup", "payroll file", "reconciliation", "send you"],
      },
      {
        id: "hc60-turnover-clearance",
        speakerKey: "foster",
        title: "Infection-control turnover clearance",
        ask: "(At the containment edge near the finished wing) Before this wing goes back to patients, what has to happen for Infection Control to clear it, and where are you in that sequence?",
        fullAnswer:
          "Knows the clearance requirements — terminal/HEPA cleaning, correct containment take-down sequence, verified pressure relationships — and that the clearance walk with Infection Control is scheduled before any move-in date is promised.",
        sourceHint:
          "The ICRA close-out / clearance checklist and Infection Control's sign-off — offer to schedule the clearance walk and share the checklist.",
        skill: "field",
        fullKeywords: ["terminal clean", "hepa", "clearance", "containment", "pressure", "infection control", "sign-off"],
        sourceKeywords: ["clearance checklist", "icra", "infection control", "schedule the walk", "sign-off"],
      },
    ],
    outro: {
      speaker: "whitlock",
      text: "(Back at the trailer) That's what I needed. Minutes and action items by tomorrow, and I'll want the med-gas verification date and the closeout checklist in writing. One more of these before we're talking final acceptance. Adjourned.",
    },
  },
};

export const HC_MEETINGS: TrainingMeeting[] = [
  HC_BID_REVIEW_MEETING,
  HC_PROGRESS_DAY30,
  HC_PROGRESS_DAY60,
];

/* ── Coach narration (VA-flavored briefings) ─────────────────────────────── */

/** Extra orientation appended to the day-one welcome on a VA sandbox. */
export const HC_WELCOME_ADDENDUM =
  "One more thing before you dive in: this is a federal VA job inside an operating hospital, so it plays by different rules than a private project. Your owner is a Contracting Officer who only directs changes in writing — never build off a verbal. You're renovating around live patients, so nothing happens without an infection-control (ICRA) permit and interim life-safety measures. Every worker needs a VA background check and badge before they can even get on site, and we won it as an SDVOSB set-aside, so you can't subcontract more than 85 percent of the work to non-certified firms. Keep those front of mind and you'll do great.";

/**
 * Hand-authored VA-flavored coach briefing per scheduled PM day. Returns null
 * for days without an authored script (the caller falls back to the generic
 * schedule-derived briefing). Mirrors the default authored days.
 */
export function healthcareDayBriefing(day: number, firstName: string): string | null {
  switch (day) {
    case 2:
      return `Good to have you back, ${firstName}. You're in buyout, and on this VA job buyout has to solve two things at once — cost and compliance. Level your bids trade by trade, but remember the 85% subcontracting limit: if you award your biggest trades to the low non-certified bidders, you blow the SDVOSB cap. Lean on the certified firms for the big dollars, or plan self-performed scope to stay inside it, and start building the subcontracting-compliance plan the Contracting Officer is going to ask for. And release the healthcare-grade switchgear and UPS now — that gear is nearly a year out.`;
    case 3:
      return `This week you put subcontracts on paper and get your compliance machine running, ${firstName}. Two things that are pure VA: submit your worker rosters to VA Police so badging can start — it takes three to four weeks and no one works without a credential — and get your ICRA and interim-life-safety plans to Infection Control before any demo. No signed ICRA permit, no work in occupied space. Stand up certified payroll now too; Davis-Bacon means a WH-347 from every sub, every week.`;
    case 4:
      return `Keep the awards moving — demo and abatement, electrical, mechanical, med-gas plumbing. Route your early submittals fast, and flag the ones the A/E told you he'll scrutinize: medical gas and fire alarm get full review, so don't fabricate on an approval you haven't received. Confirm your med-gas installer holds current ASSE braze certs and line up an independent ASSE 6030 verifier early — that gates occupancy later.`;
    case 5:
      return `Boots on the ground, ${firstName}. Before crews mobilize, make sure their badges cleared — plan for it, don't get caught with a crew at the gate. Build your ICRA containment for the first work area — hard barriers, negative air, HEPA, anteroom — and get Infection Control to walk and sign it. And start planning the 626 power tie-in backwards from a 2 a.m. outage window: hospital engineering needs a written Method of Procedure with six weeks' notice.`;
    case 6:
      return `Baseline the schedule with your superintendent and make sure the phasing keeps the clinics open — you can't just take patient corridors offline. Get your first pay application in, but only bill what's installed, and make sure every sub's certified payroll is current or accounting can't certify it to the VA. Keep pushing the long-lead med-gas and critical-power submittals.`;
    case 7:
      return `Last week of preconstruction, ${firstName}. Goal: be bought out and compliant — your SDVOSB subcontracting plan in the CO's hands, certified payroll flowing, badging pipeline full, ICRA permits approved for the first areas. Set your standing cadence: weekly sub coordination and a rolling three-week look-ahead. Get those rhythms in place and the build runs cleaner.`;
    case 14:
      return `Into the work now — demolition and infrastructure inside the occupied building. The thing that bites people here: honor the ICRA containment and interim life safety every single day, because Infection Control can red-tag your area in a heartbeat. If your demo crew hits something the survey didn't show — say suspect asbestos above a ceiling — stop, notify the Contracting Officer in writing, and pursue an REA. Do not let anyone talk you into self-helping off a verbal.`;
    case 28:
      return `Rough-in and systems, ${firstName}. Med gas, normal and emergency power, nurse call, controls — this is a systems-heavy hospital job. Keep your firestopping and smoke-barrier penetrations correct and inspected before ceilings close; an open smoke barrier in an occupied corridor is a life-safety problem, not a punch item. Stay ahead of the med-gas verification and keep the critical-power delivery on your radar.`;
    case 42:
      return `Envelope and the power tie-in window. If your outage isn't submitted with a real Method of Procedure and six weeks' notice, Facilities will say no and your electrical sequence stalls — so run that to ground. When you impair fire protection to do the tie-in, a continuous ILSM fire watch is mandatory. Complete and inspect your rough-in, and keep the certified payroll and SDVOSB reports current — the CO's office spot-checks.`;
    case 56:
      return `Interior finishes and the run to turnover. This is where the occupancy chain matters: get the medical gas through ASSE verification, finish fire-alarm and life-safety acceptance, and schedule the Infection Control clearance — that wing goes back to patients, so it has to be clean to a clinical standard, not just "done." Manage retainage and keep your pay apps honest; front-loaded billing gets caught on a federal job.`;
    case 70:
      return `Home stretch, ${firstName} — commissioning and federal closeout. Finish functional testing and TAB, self-punch before the COR walks it, and get your Certificate of Occupancy. Then close it out the VA way: O&M manuals, as-builts, warranties, commissioning reports, medical-gas certification, final certified payrolls with no open Davis-Bacon deficiencies, your SDVOSB compliance certificate, consent of surety, and release of claims. A clean closeout package is how you get retainage released fast. Finish strong.`;
    default:
      return null;
  }
}
