/**
 * Deliverable templates + grading definitions for "SiteCommand Training"
 * sandboxes.
 *
 * Scheduled tasks that produce a *document* deliverable (gap log, submittal
 * register, pay application, owner report, …) are backed by a downloadable
 * Excel template. The trainee downloads the template from the Day panel /
 * deliverable workspace, fills it out, and submits the completed workbook.
 * Where the deliverable has a follow-up step ("email the completed log to the
 * architect"), the submission also sends the simulated email to the named
 * project personas; the workbook is then AI-graded against this module's
 * criteria and the grade shows next to the task in the Day panel.
 *
 * Client-safe (pure content + lookups, no server-only imports) so the Day
 * panel, the deliverable workspace page, and the grading API all share one
 * source of truth. Template .xlsx files are generated from these definitions
 * by scripts/generate-training-templates.ts into public/training/templates/.
 */

import type { SimRole } from "@/lib/simulation-constants";
import { inboxSendersForType, type InboxSender } from "@/lib/training-inbox";
import { subsForType } from "@/lib/training-emails";
import { meetingsForType, bidTabText } from "@/lib/training-meetings";
import { HEALTHCARE_TYPE } from "@/lib/training-healthcare";

export type DeliverableCriterion = {
  id: string;
  /** Short label shown on the graded checklist. */
  title: string;
  /** What a strong submission contains — shown to the trainee and the grader. */
  detail: string;
  /** Degraded-mode keywords: any match in the workbook counts the criterion met. */
  keywords: string[];
};

export type DeliverableFollowUp = {
  /** Instructions revealed when the task is checked off ("email this to …"). */
  summary: string;
  /** Subject line of the simulated outbound email sent on submission. */
  emailSubject: string;
  /** INBOX_SENDERS keys (default pack) to send the completed file to. */
  recipients: string[];
  /** Healthcare-pack override (HC_INBOX_SENDERS keys). Falls back to `recipients`. */
  hcRecipients?: string[];
};

export type TrainingDeliverable = {
  /** Stable id — storage paths, conversation ids, and URLs key off this. */
  id: string;
  role: SimRole;
  /** In-sim day whose task batch carries the deliverable. */
  day: number;
  /** The exact TrainingTask.task string this deliverable belongs to. */
  taskMatch: string;
  /** Deliverable name (e.g. "CD Review Gap Log"). */
  title: string;
  /** Template download: path under public/ + the label shown on the link. */
  templateFile: string;
  templateLabel: string;
  /** Header row of the template workbook (also fed to the grader). */
  columns: string[];
  /** One illustrative example row seeded into the template. */
  sampleRow: (string | number)[];
  /** How to fill the workbook out. */
  instructions: string[];
  /**
   * The step after completing the workbook. Absent = no email required — the
   * submission grades directly and the file goes to the project record.
   */
  followUp?: DeliverableFollowUp;
  /** What the grade is based on. */
  criteria: DeliverableCriterion[];
  /** Extra grounding facts for the AI grader (bid numbers, lead times, …). */
  facts?: (projectType?: string | null) => string;
};

/* ── shared grounding helpers ────────────────────────────────────────────── */

/** The seeded sub roster formatted for grader grounding. */
function rosterFacts(projectType?: string | null): string {
  return subsForType(projectType)
    .map((s) => `${s.trade}: ${s.company} (${s.first} ${s.last}) — bid $${s.bid.toLocaleString("en-US")}`)
    .join("\n");
}

/** The Day-1 bid-review meeting's bid tab for the active pack. */
function bidTabFacts(projectType?: string | null): string {
  const day1 = meetingsForType(projectType).find((m) => m.day === 1);
  return day1?.facts ?? bidTabText();
}

/* ── definitions ─────────────────────────────────────────────────────────── */

const PM_DELIVERABLES: TrainingDeliverable[] = [
  {
    id: "pm-d1-gap-log",
    role: "project_manager",
    day: 1,
    taskMatch:
      "Begin detailed review of construction documents (architectural, structural, MEP, civil) for gaps and conflicts",
    title: "CD Review Gap Log",
    templateFile: "/training/templates/pm-d1-gap-log.xlsx",
    templateLabel: "Gap Log template (Excel)",
    columns: [
      "Item #",
      "Discipline",
      "Sheet / Detail Ref",
      "Spec Section",
      "Description of Gap / Conflict",
      "Impact (Cost / Schedule / Quality)",
      "Severity (High / Med / Low)",
      "RFI Needed? (Y/N)",
      "Status",
    ],
    sampleRow: [
      1,
      "Structural vs Architectural",
      "S2.01 / A4.12",
      "03 30 00",
      "Column grid at line C conflicts with corridor wall layout",
      "Schedule",
      "High",
      "Y",
      "Open",
    ],
    instructions: [
      "Work through the bid drawing set discipline by discipline (architectural, structural, MEP, civil) plus Addenda 1–2.",
      "Log every gap, conflict, or missing detail you find — one row per item, with the sheet reference so the design team can find it.",
      "Rate the impact and severity of each item and flag which ones need an RFI.",
      "Aim for real, specific findings; vague entries like \"check dimensions\" don't help anyone.",
    ],
    followUp: {
      summary:
        "Email the completed gap log to the project architect so the design team can start resolving the conflicts (the high-severity items will feed your first RFIs).",
      emailSubject: "CD review — gap & conflict log for your review",
      recipients: ["architect"],
      hcRecipients: ["ae_architect"],
    },
    criteria: [
      {
        id: "coverage",
        title: "Covers all disciplines",
        detail: "Findings span architectural, structural, MEP, and civil sheets — not just one discipline.",
        keywords: ["structural", "civil", "mechanical", "electrical", "plumbing"],
      },
      {
        id: "specific",
        title: "Specific, referenced findings",
        detail: "Each item cites a sheet/detail reference and describes a concrete conflict, not a generic note.",
        keywords: ["a", "s2", "m", "e", "detail", "sheet"],
      },
      {
        id: "volume",
        title: "Meaningful volume",
        detail: "At least 6–8 logged items — a first-pass CD review on a job this size always surfaces more than a couple.",
        keywords: [],
      },
      {
        id: "triage",
        title: "Severity + RFI triage",
        detail: "Items carry severity ratings and the high-impact ones are flagged for RFIs.",
        keywords: ["high", "rfi", "y"],
      },
    ],
  },
  {
    id: "pm-d2-bid-leveling",
    role: "project_manager",
    day: 2,
    taskMatch:
      "Level (scope-check) bids by trade; prepare bid comparison sheets and identify scope gaps",
    title: "Bid Leveling & Scope Gap Sheet",
    templateFile: "/training/templates/pm-d2-bid-leveling.xlsx",
    templateLabel: "Bid Leveling template (Excel)",
    columns: [
      "Trade",
      "Bidder",
      "Base Bid",
      "Scope Gaps / Exclusions",
      "Plug for Gaps ($)",
      "Leveled Total",
      "Price Hold / Notes",
      "Recommend Award? (Y/N)",
    ],
    sampleRow: [
      "Roofing",
      "Summit Ridge Roofing",
      2300000,
      "Excludes tapered insulation crickets",
      45000,
      2345000,
      "45-day price hold",
      "Y",
    ],
    instructions: [
      "Level the bids trade by trade from the Day-1 bid review — the low number is only real after you normalize scope.",
      "List every exclusion or scope gap carried in each bid and put a plug dollar value on it so leveled totals compare apples to apples.",
      "Note price-hold windows and any coverage risk (single bidder, thin coverage).",
      "Mark your award recommendation per trade.",
    ],
    criteria: [
      {
        id: "leveled-math",
        title: "Leveled totals, not raw bids",
        detail: "Gaps carry plug values and leveled totals reflect base bid + plugs — the comparison is normalized.",
        keywords: ["plug", "leveled", "gap"],
      },
      {
        id: "steel-gap",
        title: "Catches the steel scope gap",
        detail: "The structural steel apparent low's scope exclusions are identified and priced rather than taken at face value.",
        keywords: ["steel", "ironclad", "exclusion"],
      },
      {
        id: "glazing-risk",
        title: "Flags the glazing apparent-low risk",
        detail: "The glazing low bid is flagged as a scope/coverage risk, not blindly recommended.",
        keywords: ["glazing", "clearspan", "curtain wall"],
      },
      {
        id: "price-holds",
        title: "Tracks price-hold windows",
        detail: "Time-limited pricing (e.g. the roofing 45-day hold) is recorded so award timing can beat expiry.",
        keywords: ["hold", "45", "expir"],
      },
    ],
    facts: bidTabFacts,
  },
  {
    id: "pm-d2-longlead",
    role: "project_manager",
    day: 2,
    taskMatch:
      "Identify long-lead items (switchgear, elevators, windows, RTUs, generators) and lock procurement deadlines",
    title: "Long-Lead Procurement Log",
    templateFile: "/training/templates/pm-d2-longlead.xlsx",
    templateLabel: "Long-Lead Log template (Excel)",
    columns: [
      "Item",
      "Vendor / Sub",
      "Lead Time (weeks)",
      "Need-On-Site Date",
      "Release-By Date",
      "Price Hold Expires",
      "Submittal Required First? (Y/N)",
      "Status",
    ],
    sampleRow: [
      "Main switchgear",
      "Gulf States Switchgear",
      42,
      "TBD from CPM",
      "Back-calc: need date − 42 wks",
      "30 days from quote",
      "Y",
      "Quote in hand",
    ],
    instructions: [
      "List every long-lead item on the job: switchgear, generator, elevators, windows/curtain wall, RTUs, and anything else with a lead time that can drive the schedule.",
      "Back-calculate a release-by date for each item: need-on-site date minus lead time minus submittal review time.",
      "Record price-hold windows from the vendor quotes so pricing doesn't expire before release.",
      "Flag which items need an approved submittal before fabrication starts.",
    ],
    followUp: {
      summary:
        "Email the completed log to your switchgear, elevator, and HVAC equipment vendors to confirm current lead times and price-hold windows before you commit release dates.",
      emailSubject: "Long-lead procurement log — confirming lead times & price holds",
      recipients: ["switchgear_vendor", "elevator_vendor", "hvac_vendor"],
      hcRecipients: ["ups_vendor"],
    },
    criteria: [
      {
        id: "coverage",
        title: "All major long-lead items",
        detail: "Switchgear, generator, elevators, windows, and RTUs all appear (plus anything project-specific).",
        keywords: ["switchgear", "elevator", "window", "rtu", "generator"],
      },
      {
        id: "release-math",
        title: "Release dates back-calculated",
        detail: "Release-by dates work backward from need-on-site through lead time and submittal review — not guessed.",
        keywords: ["release", "week", "need"],
      },
      {
        id: "switchgear-lead",
        title: "Switchgear treated as critical",
        detail: "The ~42-week switchgear lead and its 30-day price hold are captured — it's the item most likely to set the finish date.",
        keywords: ["42", "30", "hold"],
      },
      {
        id: "submittal-gate",
        title: "Submittal-before-fab flagged",
        detail: "Items that can't be released until a submittal is approved are flagged so approvals get expedited.",
        keywords: ["submittal", "y", "approv"],
      },
    ],
    facts: () =>
      "Vendor quotes in hand: main switchgear 42-week lead with a 30-day price hold (Gulf States Switchgear); elevators require an approved submittal to lock a fabrication slot (Apex Elevator Systems); RTU lead times have been slipping industry-wide (Pinnacle HVAC Equipment).",
  },
  {
    id: "pm-d3-submittal-register",
    role: "project_manager",
    day: 3,
    taskMatch: "Build submittal log / register from spec sections, organized by CSI division",
    title: "Submittal Register",
    templateFile: "/training/templates/pm-d3-submittal-register.xlsx",
    templateLabel: "Submittal Register template (Excel)",
    columns: [
      "Spec Section",
      "CSI Division",
      "Submittal Item",
      "Type (PD / Shop Dwg / Sample)",
      "Responsible Sub",
      "Required On Site",
      "Submit-By Date",
      "Review SLA (days)",
      "Long-Lead? (Y/N)",
      "Status",
    ],
    sampleRow: [
      "03 30 00",
      "03 — Concrete",
      "Concrete mix designs",
      "Product Data",
      "Bedrock Concrete",
      "Before first pour",
      "ASAP",
      10,
      "N",
      "Not started",
    ],
    instructions: [
      "Walk the spec book section by section and log every required submittal, organized by CSI division.",
      "Assign each item to its responsible subcontractor and back-calculate a submit-by date from when the material is needed on site.",
      "Enter the review turnaround (SLA) you need from the design team per item.",
      "Flag long-lead submittals — those are the ones that can't wait.",
    ],
    followUp: {
      summary:
        "Email the register to the project architect ahead of your log-review meeting so the design team can confirm required items and commit to review turnarounds.",
      emailSubject: "Submittal register for review — turnaround commitments needed",
      recipients: ["architect"],
      hcRecipients: ["ae_architect"],
    },
    criteria: [
      {
        id: "csi-breadth",
        title: "Covers the major CSI divisions",
        detail: "Concrete (03), steel (05), thermal/moisture (07), openings (08), finishes (09), fire (21), plumbing (22), HVAC (23), and electrical (26) all appear.",
        keywords: ["03", "05", "07", "08", "09", "21", "22", "23", "26"],
      },
      {
        id: "ownership",
        title: "Every item has an owner",
        detail: "Each submittal is assigned to a responsible subcontractor from the roster.",
        keywords: ["bedrock", "ironclad", "voltura", "cardinal", "northwind"],
      },
      {
        id: "dates",
        title: "Dates driven by need, not hope",
        detail: "Submit-by dates back-calculate from required-on-site dates through the review SLA.",
        keywords: ["before", "pour", "asap", "week"],
      },
      {
        id: "longlead-flag",
        title: "Long-lead items flagged",
        detail: "Envelope, switchgear, and elevator submittals are marked long-lead for expedited routing.",
        keywords: ["switchgear", "elevator", "window", "y"],
      },
    ],
    facts: rosterFacts,
  },
  {
    id: "pm-d3-sov",
    role: "project_manager",
    day: 3,
    taskMatch: "Set up Schedule of Values (SOV) for prime contract; request sub SOVs",
    title: "Prime Contract Schedule of Values",
    templateFile: "/training/templates/pm-d3-sov.xlsx",
    templateLabel: "SOV template (Excel)",
    columns: [
      "Line #",
      "Cost Code",
      "Description of Work",
      "Scheduled Value",
      "% of Contract",
      "Retainage %",
      "Notes",
    ],
    sampleRow: [1, "01-000", "General conditions", 1850000, "≈4%", 10, "Billed monthly, level"],
    instructions: [
      "Break the prime contract value into billable lines by cost code / trade — enough detail that monthly billing is defensible, not one lump line.",
      "Include general conditions, general requirements, and fee lines alongside the trade lines.",
      "Confirm the lines sum exactly to the contract value and note the retainage terms.",
      "This is the billing backbone for every pay app that follows — structure it the way you want to bill.",
    ],
    followUp: {
      summary:
        "Email the draft SOV to the owner's representative for approval before the first pay application cycle.",
      emailSubject: "Draft Schedule of Values for approval",
      recipients: ["owner_rep"],
      hcRecipients: ["contracting_officer"],
    },
    criteria: [
      {
        id: "granularity",
        title: "Real line-item breakdown",
        detail: "The contract is broken into 15+ trade/cost-code lines — granular enough to bill against, no catch-all lumps.",
        keywords: ["concrete", "steel", "electrical", "plumbing", "hvac", "roofing"],
      },
      {
        id: "gcs",
        title: "GCs / GRs / fee present",
        detail: "General conditions, general requirements, and fee appear as their own lines.",
        keywords: ["general conditions", "fee", "general requirements"],
      },
      {
        id: "math",
        title: "Sums to the contract",
        detail: "Scheduled values total to a stated contract value with the math shown.",
        keywords: ["total", "contract"],
      },
      {
        id: "retainage",
        title: "Retainage terms stated",
        detail: "Retainage percentage is recorded per line or globally.",
        keywords: ["10", "5", "retainage"],
      },
    ],
  },
  {
    id: "pm-d3-compliance",
    role: "project_manager",
    day: 3,
    taskMatch: "Collect and review COIs, bonds, and W-9s from awarded subs",
    title: "Subcontractor Compliance Log",
    templateFile: "/training/templates/pm-d3-compliance.xlsx",
    templateLabel: "Compliance Log template (Excel)",
    columns: [
      "Subcontractor",
      "Trade",
      "COI Received? (Y/N)",
      "GL Limits OK?",
      "Additional Insured?",
      "Waiver of Subrogation?",
      "COI Expiration",
      "Bond Required / Received",
      "W-9 Received?",
      "Cleared to Mobilize? (Y/N)",
    ],
    sampleRow: [
      "Bedrock Concrete",
      "Concrete / Foundations",
      "Y",
      "Y — $2M/$4M",
      "Y",
      "Y",
      "2026-12-31",
      "Req — Received",
      "Y",
      "Y",
    ],
    instructions: [
      "List every awarded/roster subcontractor and track their insurance, bond, and tax paperwork.",
      "Verify COI limits meet the contract requirements and that additional-insured and waiver-of-subrogation endorsements are on the certificate.",
      "Track certificate expiration dates — an expired COI on an active sub is uncovered risk.",
      "Nobody mobilizes until their row is clear.",
    ],
    criteria: [
      {
        id: "roster",
        title: "Full roster tracked",
        detail: "All awarded subs from the roster appear — none skipped.",
        keywords: ["bedrock", "ironclad", "voltura", "cardinal", "northwind", "sentinel", "summit", "clearspan"],
      },
      {
        id: "endorsements",
        title: "Endorsements verified",
        detail: "Additional insured and waiver of subrogation are checked per sub, not just \"COI received\".",
        keywords: ["additional insured", "subrogation", "waiver"],
      },
      {
        id: "expirations",
        title: "Expiration dates tracked",
        detail: "Every certificate carries an expiration date so renewals can be chased before lapse.",
        keywords: ["2026", "2027", "expir"],
      },
      {
        id: "gate",
        title: "Mobilization gate enforced",
        detail: "A cleared-to-mobilize decision exists per sub and incomplete rows are marked not cleared.",
        keywords: ["n", "pending", "cleared"],
      },
    ],
    facts: rosterFacts,
  },
  {
    id: "pm-d5-utility-matrix",
    role: "project_manager",
    day: 5,
    taskMatch: "Confirm utility coordination (power, water, sewer, gas, telecom) with providers",
    title: "Utility Coordination Matrix",
    templateFile: "/training/templates/pm-d5-utility-matrix.xlsx",
    templateLabel: "Utility Matrix template (Excel)",
    columns: [
      "Utility",
      "Provider",
      "Contact",
      "Application Status",
      "Design / Load Info Owed",
      "Required Lead Time",
      "Tie-In / Energization Date",
      "Risks / Notes",
    ],
    sampleRow: [
      "Electric (permanent)",
      "Piedmont Power & Light",
      "Marcus Reed",
      "Service application submitted",
      "Load letter + panel locations & ampacities",
      "16+ weeks from approved design",
      "TBD",
      "Temp-to-perm cutover gates TCO",
    ],
    instructions: [
      "One row per utility: permanent power, temp power, water, sanitary sewer, storm, gas, and telecom.",
      "Record the provider, your contact, where the application stands, and what design information you still owe them.",
      "Capture each provider's lead time and work backward to when applications must be complete.",
      "Note the risks — utility tie-ins are schedule killers precisely because they look far away.",
    ],
    followUp: {
      summary:
        "Email the matrix to the power company's service design consultant to confirm the application status and what they still need from you.",
      emailSubject: "Utility coordination matrix — confirming status & requirements",
      recipients: ["utility_rep"],
      hcRecipients: ["facilities"],
    },
    criteria: [
      {
        id: "coverage",
        title: "All utilities covered",
        detail: "Power, water, sewer, gas, and telecom each have a row (temp and permanent power tracked separately is a plus).",
        keywords: ["water", "sewer", "gas", "telecom", "power"],
      },
      {
        id: "load-letter",
        title: "Power application requirements owed",
        detail: "The electric row reflects the utility's outstanding asks — the load letter and panel/load-center locations & ampacities.",
        keywords: ["load letter", "ampacit", "panel"],
      },
      {
        id: "leads",
        title: "Lead times captured",
        detail: "Each provider has a stated lead time driving a submit-by date.",
        keywords: ["week", "lead"],
      },
      {
        id: "contacts",
        title: "Named contacts",
        detail: "A real person is on the hook for each utility, not just a company name.",
        keywords: ["marcus", "reed"],
      },
    ],
    facts: () =>
      "The utility (Piedmont Power & Light, Marcus Reed) has an open service application and is waiting on a load letter plus panel/load-center locations and ampacities from the project team. Permanent power energization gates the temp-to-perm cutover late in the job.",
  },
  {
    id: "pm-d6-payapp",
    role: "project_manager",
    day: 6,
    taskMatch: "Submit and track first pay application (mobilization, general conditions, early work)",
    title: "Pay Application No. 1 (Continuation Sheet)",
    templateFile: "/training/templates/pm-d6-payapp.xlsx",
    templateLabel: "Pay App template (Excel)",
    columns: [
      "Line #",
      "Description of Work",
      "Scheduled Value",
      "Previous Applications",
      "This Period",
      "Total Completed & Stored",
      "% Complete",
      "Balance to Finish",
      "Retainage",
    ],
    sampleRow: [1, "Mobilization", 350000, 0, 350000, 350000, "100%", 0, 35000],
    instructions: [
      "Build Pay App No. 1 on your SOV lines — this first app should carry mobilization, general conditions to date, and any completed early work only.",
      "Keep the continuation-sheet math honest: previous + this period = total completed; total ÷ scheduled value = % complete; scheduled − total = balance to finish.",
      "Apply retainage consistently to every billed line.",
      "Do not front-load — billing ahead of installed work is how trust with the owner dies.",
    ],
    followUp: {
      summary:
        "Email the pay app to your accounting manager to process, copying the owner's representative for the formal submission.",
      emailSubject: "Pay Application No. 1 for processing",
      recipients: ["accounting", "owner_rep"],
      hcRecipients: ["accounting", "contracting_officer"],
    },
    criteria: [
      {
        id: "scope",
        title: "App #1 scope is right",
        detail: "Only mobilization, GCs, and genuinely completed early work are billed — no billing against work not started.",
        keywords: ["mobilization", "general conditions"],
      },
      {
        id: "math",
        title: "Continuation math consistent",
        detail: "Previous (0 on app #1) + this period = total; % complete and balance-to-finish tie to scheduled values.",
        keywords: ["0", "100"],
      },
      {
        id: "retainage",
        title: "Retainage applied",
        detail: "Retainage is calculated on every billed line at a consistent rate.",
        keywords: ["retainage", "10%", "5%"],
      },
      {
        id: "no-frontload",
        title: "No front-loading",
        detail: "Billed percentages are defensible against actual progress in week 6 — heavy trade billing this early is a red flag.",
        keywords: [],
      },
    ],
  },
  {
    id: "pm-d6-itp",
    role: "project_manager",
    day: 6,
    taskMatch: "Establish QA/QC plan, Inspection & Test Plan (ITP), and mockup requirements",
    title: "Inspection & Test Plan (ITP)",
    templateFile: "/training/templates/pm-d6-itp.xlsx",
    templateLabel: "ITP template (Excel)",
    columns: [
      "Definable Feature of Work",
      "Test / Inspection",
      "Standard / Acceptance Criteria",
      "Frequency",
      "Hold or Witness Point?",
      "Responsible Party",
      "Records To Keep",
    ],
    sampleRow: [
      "Structural concrete",
      "Slump + cylinders (set of 5)",
      "ACI 301 / f'c 4,000 psi @ 28d",
      "Each 50 CY or each pour",
      "Witness",
      "Testing agency",
      "Break reports",
    ],
    instructions: [
      "List the definable features of work (earthwork, concrete, steel, envelope, MEP rough, firestop, …) and the tests/inspections each requires.",
      "Cite the standard or acceptance criteria per test and how often it runs.",
      "Mark hold points (work stops until sign-off) vs witness points, and who performs each.",
      "Include the mockups the job requires (exterior wall assembly, unit, window install).",
    ],
    followUp: {
      summary:
        "Email the ITP to the project architect for design-team concurrence before field work ramps up.",
      emailSubject: "QA/QC Inspection & Test Plan for concurrence",
      recipients: ["architect"],
      hcRecipients: ["ae_architect"],
    },
    criteria: [
      {
        id: "features",
        title: "Definable features covered",
        detail: "Earthwork/compaction, concrete, steel, envelope, MEP rough-in, and fire assemblies all appear.",
        keywords: ["compaction", "concrete", "steel", "envelope", "firestop"],
      },
      {
        id: "standards",
        title: "Standards cited",
        detail: "Tests reference real criteria (ACI, ASTM, psi, proctor %) rather than \"per spec\".",
        keywords: ["aci", "astm", "psi", "95%"],
      },
      {
        id: "holds",
        title: "Hold vs witness points",
        detail: "The plan distinguishes hold points from witness points so the field knows what stops work.",
        keywords: ["hold", "witness"],
      },
      {
        id: "mockups",
        title: "Mockups included",
        detail: "Required mockups are listed with their approval gate.",
        keywords: ["mockup", "mock-up"],
      },
    ],
  },
  {
    id: "pm-d10-inspection-matrix",
    role: "project_manager",
    day: 10,
    taskMatch: "Review permit conditions and build the inspection / special-inspections matrix",
    title: "Inspection & Special Inspections Matrix",
    templateFile: "/training/templates/pm-d10-inspection-matrix.xlsx",
    templateLabel: "Inspection Matrix template (Excel)",
    columns: [
      "Phase of Work",
      "Inspection",
      "Type (City / Special / 3rd Party)",
      "Agency / Inspector",
      "Scheduling Lead Time",
      "Prerequisites",
      "Permit Condition Ref",
      "Status",
    ],
    sampleRow: [
      "Foundations",
      "Footing / reinforcement",
      "City + Special",
      "City of Riverton + testing agency",
      "48 hours notice",
      "Rebar placed, forms complete",
      "Permit cond. #4",
      "Not started",
    ],
    instructions: [
      "Work from the permit conditions and the statement of special inspections — every required inspection gets a row.",
      "Cover the city inspection sequence (footings, slab, framing, rough MEP, insulation, finals) and the special inspections (soils/compaction, concrete, steel connections, firestop).",
      "Record the scheduling lead time and the prerequisites for each so the field never covers uninspected work.",
      "Tie rows back to the permit condition that requires them.",
    ],
    followUp: {
      summary:
        "Email the matrix to the building department's inspections coordinator to confirm the required inspections and the scheduling protocol.",
      emailSubject: "Inspection matrix — confirming requirements & scheduling protocol",
      recipients: ["building_dept"],
      hcRecipients: ["cor"],
    },
    criteria: [
      {
        id: "city-seq",
        title: "City sequence complete",
        detail: "Footing, slab, framing, rough MEP, insulation, and final inspections are all present.",
        keywords: ["footing", "framing", "rough", "insulation", "final"],
      },
      {
        id: "special",
        title: "Special inspections included",
        detail: "Soils/compaction, concrete, structural steel, and firestop special inspections appear with their agency.",
        keywords: ["compaction", "soils", "firestop", "special"],
      },
      {
        id: "leads",
        title: "Scheduling leads captured",
        detail: "Notice/lead time is recorded per inspection so scheduling is proactive.",
        keywords: ["48", "24", "notice"],
      },
      {
        id: "prereqs",
        title: "Prerequisites defined",
        detail: "Each inspection lists what must be complete before calling it in.",
        keywords: ["complete", "placed", "installed"],
      },
    ],
  },
  {
    id: "pm-d14-pour-log",
    role: "project_manager",
    day: 14,
    taskMatch: "Manage concrete testing (slump, breaks) and structural special inspections",
    title: "Concrete Pour & Test Log",
    templateFile: "/training/templates/pm-d14-pour-log.xlsx",
    templateLabel: "Pour Log template (Excel)",
    columns: [
      "Pour #",
      "Date",
      "Element / Location",
      "CY Placed",
      "Design Strength (psi)",
      "Slump Spec / Actual",
      "Cylinders Cast",
      "7-Day Break",
      "28-Day Break",
      "Special Inspection Sign-Off",
      "Notes",
    ],
    sampleRow: [
      1,
      "2026-08-04",
      "Footings — grid A-D",
      85,
      4000,
      '4" ±1 / 4.25"',
      5,
      "Pending",
      "Pending",
      "Y — on file",
      "",
    ],
    instructions: [
      "Log every pour with its location, quantity, and design strength.",
      "Track cylinders cast per pour and the 7- and 28-day break results as they come in.",
      "Record the special inspection sign-off for each pour — no pour is closed without it on file.",
      "Note the testing agency's notification lead so pours are never made without coverage.",
    ],
    followUp: {
      summary:
        "Email the log format to the testing agency's field manager to align on cylinder sets, notification lead time, and how break reports will flow back.",
      emailSubject: "Concrete pour & test log — aligning on testing protocol",
      recipients: ["testing_agency"],
      hcRecipients: ["testing_agency"],
    },
    criteria: [
      {
        id: "per-pour",
        title: "Per-pour tracking",
        detail: "Each pour is a row with location, quantity, and design strength — traceable to a spot on the structure.",
        keywords: ["footing", "slab", "grid", "cy"],
      },
      {
        id: "breaks",
        title: "Break results tracked to closure",
        detail: "7- and 28-day results are tracked per pour, with pending results visible (not forgotten).",
        keywords: ["7", "28", "pending", "psi"],
      },
      {
        id: "signoff",
        title: "Special inspection per pour",
        detail: "Each pour carries its special-inspection sign-off status — nothing covered without it.",
        keywords: ["sign", "y", "file"],
      },
      {
        id: "protocol",
        title: "Testing protocol noted",
        detail: "Cylinder counts and the notification lead time for the agency are recorded.",
        keywords: ["cylinder", "notice", "24", "48"],
      },
    ],
  },
  {
    id: "pm-d21-buyout-recon",
    role: "project_manager",
    day: 21,
    taskMatch: "Reconcile buyout vs. budget after the early awards; process the first change events",
    title: "Buyout vs Budget Reconciliation",
    templateFile: "/training/templates/pm-d21-buyout-recon.xlsx",
    templateLabel: "Buyout Reconciliation template (Excel)",
    columns: [
      "Cost Code / Trade",
      "Budget",
      "Awarded Value",
      "Variance ($)",
      "Variance Explanation",
      "Remaining To Buy",
      "Exposure / Risk",
    ],
    sampleRow: [
      "03 — Concrete",
      4300000,
      4250000,
      50000,
      "Awarded under budget at bid number",
      0,
      "None — bought",
    ],
    instructions: [
      "Line up every trade's budget against its awarded subcontract value and compute the variance.",
      "Explain each variance — savings, scope moved between trades, or a real bust.",
      "Quantify what's still unbought and the exposure it represents.",
      "Roll it up: are you net ahead or behind buyout, and by how much?",
    ],
    criteria: [
      {
        id: "trade-lines",
        title: "Trade-by-trade reconciliation",
        detail: "Each awarded trade shows budget, award, and computed variance using the actual award numbers.",
        keywords: ["concrete", "steel", "electrical", "plumbing", "mechanical"],
      },
      {
        id: "explanations",
        title: "Variances explained",
        detail: "Every material variance carries a reason, not just a number.",
        keywords: ["scope", "saving", "under", "over"],
      },
      {
        id: "remaining",
        title: "Remaining-to-buy exposure",
        detail: "Unbought scope is identified and its exposure quantified.",
        keywords: ["remaining", "unbought", "exposure"],
      },
      {
        id: "rollup",
        title: "Honest roll-up",
        detail: "A total line answers whether buyout is net ahead or behind budget.",
        keywords: ["total", "net"],
      },
    ],
    facts: rosterFacts,
  },
  {
    id: "pm-d21-owner-report",
    role: "project_manager",
    day: 21,
    taskMatch: "Prepare and submit the monthly owner report: schedule, cost, risks, and photos",
    title: "Monthly Owner Report",
    templateFile: "/training/templates/pm-d21-owner-report.xlsx",
    templateLabel: "Owner Report template (Excel)",
    columns: ["Section", "Item", "Status / Value", "Trend", "Narrative / Action"],
    sampleRow: [
      "Schedule",
      "Substantial completion forecast",
      "On baseline",
      "Steady",
      "Foundations tracking; watching utility tie-ins",
    ],
    instructions: [
      "Fill each section — Executive Summary, Schedule, Cost, Risks, Look-Ahead — with rows of real project status.",
      "Report schedule against the baseline and forecast substantial completion honestly.",
      "Summarize cost: contract value, approved changes, pending changes, contingency remaining.",
      "List the live risks with your mitigation — owners forgive bad news, not surprises.",
    ],
    followUp: {
      summary:
        "Email the completed report to the owner's representative — this is the formal monthly submission.",
      emailSubject: "Monthly project report",
      recipients: ["owner_rep"],
      hcRecipients: ["cor"],
    },
    criteria: [
      {
        id: "sections",
        title: "All sections filled",
        detail: "Summary, schedule, cost, risks, and look-ahead each have substantive rows.",
        keywords: ["schedule", "cost", "risk", "look"],
      },
      {
        id: "live-risks",
        title: "Names the live field problems",
        detail: "The failed trench compaction lifts and the unsuitable-soils condition appear as risks with mitigation — not hidden.",
        keywords: ["compaction", "soils", "unsuitable", "trench"],
      },
      {
        id: "cost-truth",
        title: "Cost position with changes",
        detail: "Approved and pending changes and contingency remaining are reported as numbers.",
        keywords: ["contingency", "pending", "approved"],
      },
      {
        id: "forecast",
        title: "Honest completion forecast",
        detail: "A substantial-completion forecast is stated relative to baseline, with recovery notes if slipping.",
        keywords: ["substantial", "baseline", "forecast"],
      },
    ],
    facts: () =>
      "Live issues by this point in the job: the testing agency failed two trench-backfill compaction lifts (re-work directed); an unsuitable-soils / differing-site-condition was hit and a stop-work in that area was recommended pending the geotech's direction; switchgear procurement is released and being tracked against a 42-week lead.",
  },
  {
    id: "pm-d35-payapp-audit",
    role: "project_manager",
    day: 35,
    taskMatch: "Review sub pay applications against installed work; cut any front-loaded billing",
    title: "Sub Pay App Review Worksheet",
    templateFile: "/training/templates/pm-d35-payapp-audit.xlsx",
    templateLabel: "Pay App Review template (Excel)",
    columns: [
      "Subcontractor",
      "Trade",
      "Billed This Period",
      "Billed To Date %",
      "Installed To Date % (field-verified)",
      "Delta",
      "Action (Approve / Cut)",
      "Certified Amount",
      "Lien Waiver Status",
    ],
    sampleRow: [
      "Northwind Mechanical",
      "HVAC / Mechanical",
      420000,
      "80%",
      "55%",
      "-25%",
      "Cut to installed",
      288750,
      "Conditional received",
    ],
    instructions: [
      "For each sub billing this period, compare billed-to-date percentage against what's actually installed per your field walk.",
      "Where billing runs ahead of installation, cut the certified amount to installed — approving front-loaded billing funds someone else's job.",
      "Record the adjusted certified amount and the lien waiver status per sub.",
      "Document your basis for each cut so the conversation with the sub is factual.",
    ],
    followUp: {
      summary:
        "Email the review worksheet with your adjusted certified amounts to your accounting manager so this month's sub payments process at the cut values.",
      emailSubject: "Sub pay app review — certified amounts for processing",
      recipients: ["accounting"],
      hcRecipients: ["accounting"],
    },
    criteria: [
      {
        id: "verify",
        title: "Billed vs installed verified",
        detail: "Every billing sub has both a billed % and a field-verified installed % — the comparison is actually made.",
        keywords: ["%", "installed"],
      },
      {
        id: "cuts",
        title: "Front-loading cut",
        detail: "Billing ahead of installation is cut to installed (the mechanical sub's ~80% billed vs ~55% installed is the live case).",
        keywords: ["cut", "80", "55", "northwind", "mechanical"],
      },
      {
        id: "certified",
        title: "Certified amounts computed",
        detail: "Adjusted certified amounts are calculated, not just flagged.",
        keywords: ["certified"],
      },
      {
        id: "waivers",
        title: "Lien waivers tracked",
        detail: "Waiver status (conditional/unconditional) is tracked per payment.",
        keywords: ["waiver", "conditional", "unconditional"],
      },
    ],
    facts: () =>
      "Accounting has flagged that the mechanical sub (Northwind Mechanical) is billed to roughly 80% on ductwork while the field walk supports about 55% installed — a classic pencil-draw / front-loaded billing situation the PM is expected to cut.",
  },
  {
    id: "pm-d49-forecast",
    role: "project_manager",
    day: 49,
    taskMatch: "Reforecast cost at completion; review contingency and allowance burn with the owner",
    title: "Cost Forecast (EAC) Worksheet",
    templateFile: "/training/templates/pm-d49-forecast.xlsx",
    templateLabel: "Cost Forecast template (Excel)",
    columns: [
      "Cost Code / Trade",
      "Budget",
      "Committed",
      "Actuals To Date",
      "Estimate To Complete",
      "Estimate At Completion",
      "Variance to Budget",
      "Notes",
    ],
    sampleRow: [
      "03 — Concrete",
      4300000,
      4250000,
      3800000,
      450000,
      4250000,
      50000,
      "Tracking to committed",
    ],
    instructions: [
      "Forecast every trade: EAC = actuals to date + remaining commitments + estimate to complete on unbought/exposed scope.",
      "Carry a contingency ledger — starting value, draws to date, and remaining — and the same for allowances.",
      "Roll up a projected final cost and the variance to the contract/GMP.",
      "Write the narrative: where the risk is, and what you're doing about it.",
    ],
    followUp: {
      summary:
        "Email the reforecast to the owner's representative ahead of your contingency review conversation.",
      emailSubject: "Updated cost forecast & contingency review",
      recipients: ["owner_rep"],
      hcRecipients: ["contracting_officer"],
    },
    criteria: [
      {
        id: "eac-math",
        title: "Real EAC math",
        detail: "EAC builds from actuals + commitments + ETC per line, not a copied budget column.",
        keywords: ["eac", "etc", "committed", "actual"],
      },
      {
        id: "contingency",
        title: "Contingency ledger",
        detail: "Contingency start, draws, and remaining are stated as numbers.",
        keywords: ["contingency", "remaining", "draw"],
      },
      {
        id: "allowances",
        title: "Allowance burn tracked",
        detail: "Allowance lines show budget vs actual burn.",
        keywords: ["allowance"],
      },
      {
        id: "variance",
        title: "Projected final vs contract",
        detail: "A bottom-line projected final cost and variance to the contract value is stated, with narrative.",
        keywords: ["variance", "final", "projected", "total"],
      },
    ],
  },
  {
    id: "pm-d49-energization",
    role: "project_manager",
    day: 49,
    taskMatch: "Confirm utility energization prerequisites and the meter / service schedule",
    title: "Energization Readiness Checklist",
    templateFile: "/training/templates/pm-d49-energization.xlsx",
    templateLabel: "Energization Checklist template (Excel)",
    columns: [
      "Prerequisite",
      "Owner (Us / Utility / AHJ / Sub)",
      "Required By",
      "Status",
      "Blocking? (Y/N)",
      "Notes",
    ],
    sampleRow: [
      "Electrical rough & service inspections passed",
      "AHJ / Electrical sub",
      "Before meter set",
      "Open",
      "Y",
      "Book with 48-hr notice",
    ],
    instructions: [
      "List every prerequisite on the utility's energization checklist: inspections, load letter on file, meter base set, CT cabinet, easements recorded, service lateral complete.",
      "Assign each item an owner and a required-by date working back from the target energization date.",
      "Flag the blocking items — the temp-to-perm cutover gates TCO, and the meter set always takes longer than anyone believes.",
    ],
    followUp: {
      summary:
        "Email the checklist to the utility's service design consultant to confirm nothing is missing and to request the meter/service schedule.",
      emailSubject: "Energization readiness checklist — requesting meter & service schedule",
      recipients: ["utility_rep"],
      hcRecipients: ["facilities"],
    },
    criteria: [
      {
        id: "prereqs",
        title: "Utility checklist covered",
        detail: "Inspections, meter base/CT cabinet, easements, and the service lateral all appear as prerequisites.",
        keywords: ["inspection", "meter", "easement", "ct", "lateral"],
      },
      {
        id: "owners",
        title: "Every item owned",
        detail: "Each prerequisite has a named owner (us / utility / AHJ / sub).",
        keywords: ["utility", "ahj", "sub"],
      },
      {
        id: "dates",
        title: "Backward-planned dates",
        detail: "Required-by dates work back from a stated target energization date.",
        keywords: ["before", "date"],
      },
      {
        id: "blockers",
        title: "Blockers surfaced",
        detail: "Blocking items are explicitly flagged and tied to the TCO path.",
        keywords: ["y", "tco", "block"],
      },
    ],
    facts: () =>
      "The utility issued an energization checklist earlier in the job (service application, load letter, inspections, meter equipment) and permanent power gates the temp-to-perm cutover — which in turn gates TCO. The meter set requires all prerequisites closed plus scheduling lead.",
  },
  {
    id: "pm-d56-unit-tracker",
    role: "project_manager",
    day: 56,
    taskMatch: "Track unit-by-unit completion with a finish / pre-punch tracker",
    title: "Unit Completion Tracker",
    templateFile: "/training/templates/pm-d56-unit-tracker.xlsx",
    templateLabel: "Unit Tracker template (Excel)",
    columns: [
      "Unit / Area",
      "Paint",
      "Flooring",
      "Doors / Hardware",
      "Casework / Tops",
      "MEP Trim",
      "Appliances / Fixtures",
      "Clean",
      "Pre-Punch Done",
      "% Complete",
      "Holds",
    ],
    sampleRow: ["Unit 101", "Done", "Done", "Done", "In progress", "Open", "Open", "—", "—", "55%", "Countertop remake"],
    instructions: [
      "One row per unit/area, one column per finish trade — mark each cell as work completes.",
      "Keep a % complete rollup per unit and per trade so bottlenecks are visible.",
      "Log holds (backordered material, rework) so nothing hides.",
      "This tracker is how you keep 200 units from becoming 200 surprises.",
    ],
    criteria: [
      {
        id: "matrix",
        title: "Unit × trade matrix",
        detail: "Multiple units tracked across the full finish-trade sequence.",
        keywords: ["unit", "paint", "flooring", "trim"],
      },
      {
        id: "status",
        title: "Real statuses, not blanks",
        detail: "Cells carry meaningful states (done / in progress / open) across the matrix.",
        keywords: ["done", "progress", "open"],
      },
      {
        id: "rollup",
        title: "% complete rollups",
        detail: "Per-unit completion percentages exist so progress is quantified.",
        keywords: ["%"],
      },
      {
        id: "holds",
        title: "Holds logged",
        detail: "Blocked items are named so they can be chased.",
        keywords: ["hold", "backorder", "rework", "remake"],
      },
    ],
  },
  {
    id: "pm-d63-prepunch",
    role: "project_manager",
    day: 63,
    taskMatch: "Run area-by-area pre-punch as finishes complete; assign and track corrections",
    title: "Pre-Punch Log",
    templateFile: "/training/templates/pm-d63-prepunch.xlsx",
    templateLabel: "Pre-Punch Log template (Excel)",
    columns: [
      "Item #",
      "Area / Unit",
      "Location Detail",
      "Description",
      "Responsible Trade",
      "Assigned To",
      "Due Date",
      "Status",
      "Back-Checked? (Y/N)",
    ],
    sampleRow: [
      1,
      "Unit 214",
      "Master bath",
      "Grout haze at shower tile; caulk gap at tub deck",
      "Tile",
      "Finish sub foreman",
      "2027-01-15",
      "Open",
      "N",
    ],
    instructions: [
      "Walk each completed area and log every deficiency — specific location, specific description.",
      "Assign every item to its responsible trade with a due date.",
      "Track items to closed AND back-checked — an item isn't done because the sub said so.",
      "Every item you catch now is one the owner's formal punch walk doesn't.",
    ],
    followUp: {
      summary:
        "Email the pre-punch log to the project architect to demonstrate readiness and schedule the formal punch walk.",
      emailSubject: "Pre-punch log — requesting the formal punch walk",
      recipients: ["architect"],
      hcRecipients: ["ae_architect"],
    },
    criteria: [
      {
        id: "specific",
        title: "Specific, locatable items",
        detail: "Items name the exact area and deficiency — findable by someone who wasn't on the walk.",
        keywords: ["unit", "bath", "corridor", "lobby"],
      },
      {
        id: "assigned",
        title: "Every item assigned + dated",
        detail: "Responsible trade and due date on every row.",
        keywords: ["due", "trade"],
      },
      {
        id: "backcheck",
        title: "Back-check discipline",
        detail: "A back-checked column is tracked separately from \"sub says done\".",
        keywords: ["back", "y", "n"],
      },
      {
        id: "volume",
        title: "Credible volume",
        detail: "A real pre-punch on a finishing building catches dozens of items, not three.",
        keywords: [],
      },
    ],
  },
  {
    id: "pm-d70-closeout",
    role: "project_manager",
    day: 70,
    taskMatch: "Collect closeout documents: O&M manuals, as-builts, warranties, and attic stock",
    title: "Closeout Document Tracker",
    templateFile: "/training/templates/pm-d70-closeout.xlsx",
    templateLabel: "Closeout Tracker template (Excel)",
    columns: [
      "Subcontractor / Trade",
      "O&M Manuals",
      "As-Builts",
      "Warranties",
      "Attic Stock",
      "Training Complete",
      "Final Lien Waiver",
      "Complete? (Y/N)",
      "Notes",
    ],
    sampleRow: [
      "Northwind Mechanical",
      "Received",
      "Received",
      "Received — 1yr parts/labor",
      "Filters delivered",
      "Y",
      "Pending final payment",
      "N",
      "",
    ],
    instructions: [
      "One row per subcontractor — track every closeout obligation: O&Ms, as-builts, warranties, attic stock, owner training, final waiver.",
      "Record what's received vs outstanding; chase the gaps now, not the week of turnover.",
      "The package isn't complete until every cell is closed.",
    ],
    followUp: {
      summary:
        "Email the tracker with the assembled package index to the project architect for closeout review and acceptance.",
      emailSubject: "Closeout package index for review",
      recipients: ["architect"],
      hcRecipients: ["ae_architect"],
    },
    criteria: [
      {
        id: "roster",
        title: "All subs tracked",
        detail: "Every roster sub has a closeout row — no trade skipped.",
        keywords: ["mechanical", "electric", "plumbing", "concrete", "roofing", "fire"],
      },
      {
        id: "categories",
        title: "All obligations per sub",
        detail: "O&Ms, as-builts, warranties, attic stock, training, and waivers are each tracked.",
        keywords: ["o&m", "as-built", "warrant", "attic"],
      },
      {
        id: "status",
        title: "Received vs outstanding explicit",
        detail: "Statuses distinguish received from outstanding so the chase list is obvious.",
        keywords: ["received", "pending", "outstanding"],
      },
      {
        id: "gaps",
        title: "Gap chase visible",
        detail: "Incomplete rows are marked and carry notes on what's being chased.",
        keywords: ["n", "chas", "follow"],
      },
    ],
    facts: rosterFacts,
  },
  {
    id: "pm-d77-final-billing",
    role: "project_manager",
    day: 77,
    taskMatch: "Process final billing: retainage release, final lien waivers, and consent of surety",
    title: "Final Payment Package Checklist",
    templateFile: "/training/templates/pm-d77-final-billing.xlsx",
    templateLabel: "Final Payment Checklist template (Excel)",
    columns: [
      "Item",
      "Party",
      "Amount / Reference",
      "Received / Complete? (Y/N)",
      "Date",
      "Notes",
    ],
    sampleRow: [
      "Unconditional final lien waiver",
      "Bedrock Concrete",
      "Full contract value + COs",
      "Y",
      "2027-03-02",
      "",
    ],
    instructions: [
      "Build the complete final-payment package: retainage release amount, unconditional final lien waivers from every sub, consent of surety, final change order reconciliation, and the closeout certificates.",
      "Track each item to received/complete with dates.",
      "Final payment doesn't move until every row is green — that's the leverage, use it once.",
    ],
    followUp: {
      summary:
        "Email the package checklist to your accounting manager to process final billing, copying the owner's representative for the release.",
      emailSubject: "Final payment package — retainage release processing",
      recipients: ["accounting", "owner_rep"],
      hcRecipients: ["accounting", "contracting_officer"],
    },
    criteria: [
      {
        id: "waivers",
        title: "Final waivers from every sub",
        detail: "An unconditional final lien waiver is tracked per roster sub.",
        keywords: ["unconditional", "waiver"],
      },
      {
        id: "surety",
        title: "Consent of surety",
        detail: "Consent of surety for final payment appears as a tracked item.",
        keywords: ["surety", "consent"],
      },
      {
        id: "retainage",
        title: "Retainage release quantified",
        detail: "The retainage amount being released is stated as a number.",
        keywords: ["retainage", "release"],
      },
      {
        id: "co-recon",
        title: "Final CO reconciliation",
        detail: "The change order log is reconciled to the final contract value.",
        keywords: ["change order", "final contract", "reconcil"],
      },
    ],
    facts: rosterFacts,
  },
];

/* ── lookups ─────────────────────────────────────────────────────────────── */

export const TRAINING_DELIVERABLES: TrainingDeliverable[] = PM_DELIVERABLES;

export function deliverablesForRole(role: SimRole): TrainingDeliverable[] {
  return TRAINING_DELIVERABLES.filter((d) => d.role === role);
}

export function getTrainingDeliverable(id: string): TrainingDeliverable | null {
  return TRAINING_DELIVERABLES.find((d) => d.id === id) ?? null;
}

/** The deliverable backing a scheduled task, if any (same pattern as meetings). */
export function deliverableForTask(
  role: SimRole,
  day: number,
  task: string,
): TrainingDeliverable | null {
  return (
    TRAINING_DELIVERABLES.find(
      (d) => d.role === role && d.day === day && d.taskMatch === task,
    ) ?? null
  );
}

export type ResolvedRecipient = {
  key: string;
  name: string;
  title: string;
  company: string;
  internal: boolean;
};

/**
 * Resolve a deliverable's follow-up recipients to display personas for the
 * active content pack. Unknown keys are dropped (a pack without the persona
 * simply sends to fewer people); an empty result means the follow-up degrades
 * to a no-email submission.
 */
export function resolveDeliverableRecipients(
  deliverable: TrainingDeliverable,
  projectType?: string | null,
): ResolvedRecipient[] {
  const followUp = deliverable.followUp;
  if (!followUp) return [];
  const keys =
    projectType === HEALTHCARE_TYPE && followUp.hcRecipients?.length
      ? followUp.hcRecipients
      : followUp.recipients;
  const senders = inboxSendersForType(projectType);
  return keys
    .map((key) => senders[key])
    .filter((s): s is InboxSender => !!s)
    .map((s) => ({
      key: s.key,
      name: `${s.first} ${s.last}`,
      title: s.title,
      company: s.company,
      internal: !!s.internal,
    }));
}

/** Deterministic conversation id for a deliverable's simulated email thread. */
export function deliverableConversationId(deliverableId: string): string {
  return `training-deliverable-${deliverableId}`;
}

/* ── grade display helpers ───────────────────────────────────────────────── */

export function letterForScore(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A−";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B−";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C−";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D−";
  return "F";
}

/** Tailwind classes for the grade chip (Day panel + workspace). */
export function gradeBadgeClass(score: number): string {
  if (score >= 85) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-lime-100 text-lime-800";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}
