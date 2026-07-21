/**
 * Training → Modules: end-of-lesson quizzes.
 *
 * Each Training Module (lesson in lib/training-lessons*.ts) ends with a short
 * multiple-choice quiz. This module is the single source of truth for those
 * questions and their correct answers, keyed by Lesson.id. Content is static
 * and curated, like the lessons themselves; per-user scores are tracked
 * separately in training_lesson_quiz_results (see
 * app/api/training/lessons/quiz).
 *
 * IMPORTANT: this file contains the correct answers, so it must only be
 * imported from server code (the lesson page's server component and the quiz
 * API route). The client only ever receives the answer-stripped `PublicQuiz`
 * from getPublicQuiz(), and grading happens server-side via gradeQuiz().
 */

export type QuizQuestion = {
  prompt: string;
  options: string[];
  /** 0-based index into `options` of the correct choice. */
  answer: number;
};

export type LessonQuiz = { questions: QuizQuestion[] };

/** Answer-free shape safe to send to the browser. */
export type PublicQuizQuestion = { prompt: string; options: string[] };
export type PublicQuiz = { questions: PublicQuizQuestion[] };

export const LESSON_QUIZZES: Record<string, LessonQuiz> = {
  // ═══════════════════════════ Workflows ═══════════════════════════
  "wf-rfis": {
    questions: [
      {
        prompt: "What is the primary purpose of an RFI?",
        options: [
          "To formally propose the exact product a subcontractor intends to install",
          "To formally ask the design team to resolve a gap, conflict, or ambiguity in the contract documents",
          "To bill the owner for extra work already performed",
          "To schedule a subcontractor's crew for the week",
        ],
        answer: 1,
      },
      {
        prompt: "\"Ball in court\" on an RFI refers to:",
        options: [
          "The dollar value of the potential change",
          "Whoever owes the next response — every RFI should have exactly one holder",
          "The drawing sheet the question references",
          "The date the answer is needed in the field",
        ],
        answer: 1,
      },
      {
        prompt: "Which is a common RFI pitfall the lesson warns against?",
        options: [
          "Attaching a drawing reference or photo to the question",
          "Reviewing the open RFI log weekly",
          "Waiting until the crew is standing in front of the conflict to issue the RFI",
          "Assigning a single ball-in-court holder",
        ],
        answer: 2,
      },
    ],
  },
  "wf-submittals": {
    questions: [
      {
        prompt: "A submittal is best described as:",
        options: [
          "A question about unclear design intent",
          "A shop drawing, product data, or sample the sub proposes to build with, submitted for the design team's review",
          "A monthly request for payment",
          "A punch list item near the end of the job",
        ],
        answer: 1,
      },
      {
        prompt: "Why does submittal turnaround time drive the whole schedule?",
        options: [
          "Because it determines the retainage percentage",
          "Because a review delay stacks on top of long fabrication lead times and surfaces on the CPM schedule months later",
          "Because the architect bills hourly for reviews",
          "Because submittals must be approved before the contract is signed",
        ],
        answer: 1,
      },
      {
        prompt: "\"Approved as noted\" means:",
        options: [
          "Rejected outright — the sub must start over",
          "Approved, but with markups the sub must incorporate before fabrication",
          "The submittal was never received",
          "Approved with no changes of any kind",
        ],
        answer: 1,
      },
    ],
  },
  "wf-buyout": {
    questions: [
      {
        prompt: "What is the goal of buyout?",
        options: [
          "To close out the project and release retainage",
          "To convert every line of the estimate into an executed subcontract or PO — on budget, with complete scope",
          "To generate RFIs for the design team",
          "To bill the owner for stored materials",
        ],
        answer: 1,
      },
      {
        prompt: "The most expensive buyout mistake is usually:",
        options: [
          "Paying slightly too much for a single trade",
          "Missing scope entirely — a gap that falls between two trades' proposals",
          "Executing a subcontract one day late",
          "Collecting too many certificates of insurance",
        ],
        answer: 1,
      },
      {
        prompt: "\"Leveling\" bids means:",
        options: [
          "Averaging all the bids to set the award price",
          "Normalizing what each bidder included or excluded so you compare equivalent scope, not just bottom-line numbers",
          "Awarding to the lowest number automatically",
          "Splitting a trade evenly among all bidders",
        ],
        answer: 1,
      },
    ],
  },
  "wf-change-events": {
    questions: [
      {
        prompt: "Why is change tracked in layers (Change Event → PCO → CCO/PCCO)?",
        options: [
          "To make the paperwork longer for its own sake",
          "Because one field discovery may touch the owner contract, a subcontract, and the budget at different amounts and approval speeds",
          "Because owners require exactly three approvals for everything",
          "Because change orders are illegal without a PCO",
        ],
        answer: 1,
      },
      {
        prompt: "A PCO (Potential Change Order) is:",
        options: [
          "The executed, approved change that updates the contract value",
          "A priced but not-yet-approved change tied to a specific contract, one tier below the final change order",
          "The umbrella record capturing an issue before it is priced",
          "A subcontractor's monthly invoice",
        ],
        answer: 1,
      },
      {
        prompt: "What does a Budget ROM let an experienced PM do?",
        options: [
          "Skip the change order process entirely",
          "See the budget trending from pending changes before a single change order is signed",
          "Automatically approve all change events",
          "Bill the owner without an SOV",
        ],
        answer: 1,
      },
    ],
  },
  "wf-commitments": {
    questions: [
      {
        prompt: "What primarily distinguishes a Subcontract from a Purchase Order?",
        options: [
          "A PO is always larger in dollar value",
          "A subcontract buys an outcome (labor + material with performance risk); a PO typically buys a product",
          "Only subcontracts can have an SOV",
          "POs require retainage; subcontracts never do",
        ],
        answer: 1,
      },
      {
        prompt: "The Schedule of Values (SOV) is important because:",
        options: [
          "It is only used at closeout",
          "It defines scope AND is the basis for monthly progress billing, and change orders and SSOVs attach to it",
          "It replaces the need for a contract",
          "It is required only on Unit/Quantity Based contracts",
        ],
        answer: 1,
      },
      {
        prompt: "The Subcontractor SOV (SSOV) exists to:",
        options: [
          "Let the sub break a coarse general SOV line into finer detail so billing reflects real field progress",
          "Replace the general SOV entirely",
          "Sync detailed cost breakdowns with the ERP",
          "Allow Unit/Quantity Based contracts to bill faster",
        ],
        answer: 0,
      },
    ],
  },
  "wf-sov-payapp": {
    questions: [
      {
        prompt: "How does payment flow on a typical project?",
        options: [
          "The owner pays each subcontractor directly",
          "Uphill monthly: subs bill the GC, the GC compiles and bills the owner, money flows back down minus retainage",
          "All at once at substantial completion",
          "Downhill: the GC pays first and collects from the owner later",
        ],
        answer: 1,
      },
      {
        prompt: "Why does the GC's review of a pay app matter?",
        options: [
          "It is a rubber stamp with no real function",
          "Overbilling means the GC may have paid for work that doesn't exist if the sub later defaults",
          "It sets the retainage percentage for the contract",
          "It is required only on the final pay app",
        ],
        answer: 1,
      },
      {
        prompt: "A lien waiver is:",
        options: [
          "A document waiving the right to file a lien for the amount paid",
          "A request to increase the contract value",
          "The monthly invoice itself",
          "A permit issued by the AHJ",
        ],
        answer: 0,
      },
    ],
  },
  "wf-daily-logs": {
    questions: [
      {
        prompt: "Why does the daily log matter more than it seems?",
        options: [
          "It sets the project budget",
          "It is the project's contemporaneous record — the proof for a delay claim months later",
          "It replaces the need for RFIs",
          "It is only used to track the weather forecast",
        ],
        answer: 1,
      },
      {
        prompt: "The 3-week look-ahead is primarily a:",
        options: [
          "Full replacement for the CPM schedule",
          "Near-term coordination tool for planning manpower, deliveries, and space conflicts a few weeks out",
          "Billing document",
          "Legal contract between subs",
        ],
        answer: 1,
      },
      {
        prompt: "An OAC meeting is a forum for:",
        options: [
          "Only the owner and the bank",
          "The owner, architect, and contractor to review schedule, RFIs, submittals, and open issues",
          "Subcontractors only",
          "Closeout document collection exclusively",
        ],
        answer: 1,
      },
    ],
  },
  "wf-punch-closeout": {
    questions: [
      {
        prompt: "Substantial completion is the point where:",
        options: [
          "Every single punch item is finished",
          "The owner can use the space for its intended purpose, even if minor punch items remain",
          "Retainage is fully released and the contract ends",
          "The first pay app is submitted",
        ],
        answer: 1,
      },
      {
        prompt: "What is a GC self-punch (pre-punch)?",
        options: [
          "The architect's official punch walk",
          "Walking every space internally to fix what you can before the architect/owner ever sees it",
          "A final inspection by the AHJ",
          "The warranty walk at 11 months",
        ],
        answer: 1,
      },
      {
        prompt: "Why schedule the 11-month warranty walk?",
        options: [
          "It is required before substantial completion",
          "It is the owner's last chance to flag issues before the standard one-year warranty period closes",
          "It starts the retainage clock",
          "It is when O&M manuals are first requested",
        ],
        answer: 1,
      },
    ],
  },
  "wf-budget": {
    questions: [
      {
        prompt: "Revised budget equals:",
        options: [
          "Original budget minus retainage",
          "Original budget plus approved changes — the current authorized number",
          "Committed cost plus projected cost to complete",
          "Direct costs only",
        ],
        answer: 1,
      },
      {
        prompt: "A committed cost is:",
        options: [
          "An actual invoice already paid",
          "Dollars contractually promised (subcontracts + POs), whether or not the work is done or billed",
          "The estimator's original guess",
          "Money held back as retainage",
        ],
        answer: 1,
      },
      {
        prompt: "The lesson's rule on the monthly forecast is:",
        options: [
          "Hide bad news until you're certain, then report it",
          "Never hide bad news — a surprise in month 14 is a career problem; the same number flagged in month 6 is just management",
          "Only report the approved dollars, never exposure",
          "Report the forecast quarterly, not monthly",
        ],
        answer: 1,
      },
    ],
  },
  "wf-scheduling": {
    questions: [
      {
        prompt: "The critical path is:",
        options: [
          "The most expensive activities on the job",
          "The longest chain of dependent activities — any delay on it delays the end date day-for-day",
          "The activities with the most float",
          "The subcontractor with the largest crew",
        ],
        answer: 1,
      },
      {
        prompt: "Float is:",
        options: [
          "How long a non-critical activity can slip before it affects the end date",
          "The retainage percentage on a schedule",
          "The number of crews on site",
          "The gap between estimate and actual cost",
        ],
        answer: 0,
      },
      {
        prompt: "The baseline schedule should be:",
        options: [
          "Overwritten each month with actual progress",
          "The approved plan of record — never overwritten; updates are compared against it",
          "Deleted once construction starts",
          "The same as the 3-week look-ahead",
        ],
        answer: 1,
      },
    ],
  },
  "wf-permits": {
    questions: [
      {
        prompt: "The AHJ is:",
        options: [
          "The architect's home office",
          "The Authority Having Jurisdiction — the agency with legal authority to approve the work",
          "A type of subcontractor bond",
          "A scheduling software",
        ],
        answer: 1,
      },
      {
        prompt: "Special inspections (IBC Chapter 17) are:",
        options: [
          "AHJ code inspections done by the building department",
          "Third-party inspections (steel, concrete, soils) hired by the owner, separate from AHJ inspections",
          "The same thing as a Certificate of Occupancy",
          "Optional inspections the GC can skip",
        ],
        answer: 1,
      },
      {
        prompt: "The best way to work with an inspector is to:",
        options: [
          "Call for inspections early so they get used to visiting",
          "Argue code interpretations at the wall until they agree",
          "Call only when work is genuinely ready, have approved drawings on site, and have the foreman walk with them",
          "Avoid contact until the final inspection",
        ],
        answer: 2,
      },
    ],
  },
  "wf-quality": {
    questions: [
      {
        prompt: "The core idea of a QC program is that quality is:",
        options: [
          "A vibe you can't really schedule",
          "Cheapest caught early — a system for buying problems at the first price (first unit) rather than after cover",
          "Only the superintendent's concern",
          "Best verified after drywall and backfill",
        ],
        answer: 1,
      },
      {
        prompt: "\"First work in place\" means:",
        options: [
          "The first payment application",
          "A formal review of the first completed unit of a repetitive scope before the sub builds many more the same way",
          "The first day a sub is on site",
          "The first RFI on a project",
        ],
        answer: 1,
      },
      {
        prompt: "An NCR (nonconformance report) should be:",
        options: [
          "Ignored if the sub promises to fix it",
          "Logged, assigned, corrected, and verified — an untracked NCR is a future punch item or latent defect",
          "Filed only at closeout",
          "Sent directly to the owner without GC review",
        ],
        answer: 1,
      },
    ],
  },
  "wf-safety": {
    questions: [
      {
        prompt: "OSHA's \"Focus Four\" are:",
        options: [
          "The four largest subcontractors",
          "Falls, struck-by, caught-in/between, and electrocution",
          "The four phases of a project",
          "Four types of insurance coverage",
        ],
        answer: 1,
      },
      {
        prompt: "Why can't the PM fully delegate safety?",
        options: [
          "Because the PM personally installs guardrails",
          "Because the PM controls conditions that make sites dangerous — schedule compression, stacked trades, underfunded subs",
          "Because there is no safety director on most jobs",
          "Because OSHA requires the PM to be on site 24/7",
        ],
        answer: 1,
      },
      {
        prompt: "After a serious incident, the correct first priority is:",
        options: [
          "Preserve evidence for the investigation",
          "Care for the person first; secure the scene second",
          "Notify OSHA within 8 hours",
          "Determine who is to blame",
        ],
        answer: 1,
      },
    ],
  },
  "wf-risk": {
    questions: [
      {
        prompt: "A COI (Certificate of Insurance) in the file:",
        options: [
          "Is proof of full compliance by itself",
          "Is not compliance by itself — you must check limits, additional insured endorsement, primary & non-contributory, waiver of subrogation, and dates",
          "Replaces the subcontract",
          "Is only needed for the GC, not subs",
        ],
        answer: 1,
      },
      {
        prompt: "Builder's risk insurance covers:",
        options: [
          "The design team's errors and omissions",
          "The building itself during construction — fire, storm, theft of installed work",
          "A subcontractor's workers' comp claims",
          "The owner's operating costs after occupancy",
        ],
        answer: 1,
      },
      {
        prompt: "A performance bond differs from insurance because:",
        options: [
          "It pays the contractor with no obligation to repay",
          "The surety pays, then comes after the contractor — a bond is not insurance",
          "It only applies to private work",
          "It covers bodily injury like CGL",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════════ Concepts ═══════════════════════════
  "cn-drawings": {
    questions: [
      {
        prompt: "In a drawing set, the letter prefix (A, S, M, E, P, C) identifies:",
        options: [
          "The revision number",
          "The discipline — Architectural, Structural, Mechanical, Electrical, Plumbing, Civil",
          "The drawing scale",
          "The sheet size",
        ],
        answer: 1,
      },
      {
        prompt: "A \"section\" drawing shows:",
        options: [
          "A top-down view of a floor",
          "A straight-on view of a building face",
          "A vertical 'cut' through the building showing how floors, walls, and roof stack together",
          "A zoomed-in detail of one condition",
        ],
        answer: 2,
      },
      {
        prompt: "A revision cloud on a drawing marks:",
        options: [
          "Exactly what changed since the last issue",
          "Where the weather is expected to be bad",
          "The location of a future RFI",
          "The area covered by a specific subcontractor",
        ],
        answer: 0,
      },
    ],
  },
  "cn-rcp": {
    questions: [
      {
        prompt: "Why is a Reflected Ceiling Plan called \"reflected\"?",
        options: [
          "It is drawn upside down",
          "It is drawn as if the ceiling were a mirror laid on the floor, reflecting the layout into a top-down view",
          "It reflects the floor plan exactly",
          "It shows reflective (shiny) materials only",
        ],
        answer: 1,
      },
      {
        prompt: "Which items are typically found on an RCP?",
        options: [
          "Foundation footings and rebar",
          "Light fixtures, HVAC diffusers, sprinkler heads, and the ceiling grid",
          "Site grading and utilities",
          "Structural steel connections",
        ],
        answer: 1,
      },
      {
        prompt: "Why is the RCP a coordination flashpoint?",
        options: [
          "Because only one trade uses it",
          "Because lights, diffusers, sprinklers, and speakers from different trades compete for the same limited ceiling space",
          "Because it is never revised",
          "Because it shows only structural elements",
        ],
        answer: 1,
      },
    ],
  },
  "cn-mep": {
    questions: [
      {
        prompt: "What does MEP stand for?",
        options: [
          "Masonry, Envelope, Paving",
          "Mechanical, Electrical, Plumbing",
          "Metals, Earthwork, Protection",
          "Mechanical, Envelope, Piping",
        ],
        answer: 1,
      },
      {
        prompt: "Why is MEP where schedules often go wrong?",
        options: [
          "MEP trades never generate RFIs",
          "MEP trades all need the same wall cavities and ceiling space at roughly the same time, forcing dedicated coordination",
          "MEP work is always done first, before structure",
          "MEP has no long-lead equipment",
        ],
        answer: 1,
      },
      {
        prompt: "The difference between rough-in and trim-out is:",
        options: [
          "Rough-in is the finish phase; trim-out is concealed work",
          "Rough-in installs concealed pipe/duct/wire before walls close (inspected before cover); trim-out installs finished visible pieces near the end",
          "They are two names for the same phase",
          "Rough-in happens only on the roof",
        ],
        answer: 1,
      },
    ],
  },
  "cn-csi": {
    questions: [
      {
        prompt: "CSI MasterFormat is:",
        options: [
          "A crime-scene documentation standard",
          "The standard numbering/organizing system for construction specifications, organized into numbered Divisions",
          "A scheduling method",
          "A type of insurance policy",
        ],
        answer: 1,
      },
      {
        prompt: "Which Division covers Concrete?",
        options: ["Division 01", "Division 03", "Division 26", "Division 09"],
        answer: 1,
      },
      {
        prompt: "How does MasterFormat connect to cost?",
        options: [
          "It has no relationship to budgets",
          "Budget/cost codes almost always trace back to CSI divisions, letting a submittal, RFI, and budget line roll up to the same scope",
          "It replaces the need for budget codes",
          "It applies only to the spec book, never to cost",
        ],
        answer: 1,
      },
    ],
  },
  "cn-longlead": {
    questions: [
      {
        prompt: "What makes an item \"long-lead\"?",
        options: [
          "Its dollar value — the most expensive trades are always long-lead",
          "Its lead time — fabrication/delivery long enough that it must be ordered well before it's needed in the field",
          "The number of workers required to install it",
          "Whether it is installed on the roof",
        ],
        answer: 1,
      },
      {
        prompt: "An LOI (Letter of Intent) is used to:",
        options: [
          "Terminate a subcontractor",
          "Lock pricing early and authorize submittal work to start before the full subcontract is signed",
          "Request a change order",
          "Waive lien rights",
        ],
        answer: 1,
      },
      {
        prompt: "A procurement log answers which question that a submittal log doesn't?",
        options: [
          "Is the submittal approved?",
          "Will this item physically be on site when the schedule needs it?",
          "Who is the design architect?",
          "What is the retainage percentage?",
        ],
        answer: 1,
      },
    ],
  },
  "cn-contracts": {
    questions: [
      {
        prompt: "On a Lump Sum contract, who bears the risk of cost overruns?",
        options: [
          "The owner",
          "The GC — but the GC also keeps any savings",
          "The subcontractors only",
          "The architect",
        ],
        answer: 1,
      },
      {
        prompt: "A GMP (Guaranteed Maximum Price) contract:",
        options: [
          "Has no ceiling on cost",
          "Pays actual cost plus fee up to a ceiling, with savings below it often shared",
          "Is the same as lump sum with a different name",
          "Requires no cost transparency",
        ],
        answer: 1,
      },
      {
        prompt: "Why does contract type change how you manage change events?",
        options: [
          "It doesn't — change management is identical everywhere",
          "On lump sum every scope change needs a priced CO; on GMP some changes can be handled as budget changes without a full PCCO",
          "Cost-plus contracts forbid change orders",
          "GMP contracts never allow contingency",
        ],
        answer: 1,
      },
    ],
  },
  "cn-retainage": {
    questions: [
      {
        prompt: "Why does retainage exist?",
        options: [
          "As a penalty for poor work",
          "To preserve the payer's leverage so the sub returns to fix punch and finish the scope — a structural incentive",
          "To fund the owner's operating budget",
          "To pay the architect's fee",
        ],
        answer: 1,
      },
      {
        prompt: "A conditional lien waiver:",
        options: [
          "Takes effect immediately upon signing regardless of payment",
          "Only takes effect once the payment actually clears",
          "Cannot be used on progress payments",
          "Is the same as an unconditional waiver",
        ],
        answer: 1,
      },
      {
        prompt: "What is the single most common way a GC ends up double-exposed to a lien?",
        options: [
          "Withholding too much retainage",
          "Releasing payment before collecting the prior period's lien waivers",
          "Collecting waivers too early",
          "Using conditional waivers",
        ],
        answer: 1,
      },
    ],
  },
  "cn-rfi-vs-submittal": {
    questions: [
      {
        prompt: "The one-sentence distinction is:",
        options: [
          "An RFI proposes what to build; a submittal asks a question",
          "An RFI asks a question because design intent is unclear; a submittal proposes what the sub plans to build for an already-clear requirement",
          "They are interchangeable documents",
          "A submittal is only for the owner; an RFI is only for the sub",
        ],
        answer: 1,
      },
      {
        prompt: "Which is a typical RFI outcome?",
        options: [
          "Approved as Noted",
          "A written answer or clarification",
          "Revise & Resubmit",
          "Rejected for fabrication",
        ],
        answer: 1,
      },
      {
        prompt: "Why does mixing up the two cost time?",
        options: [
          "It doesn't affect turnaround at all",
          "It sends the document to the wrong reviewer with the wrong expectations, costing a review cycle",
          "It automatically approves the wrong scope",
          "It voids the subcontract",
        ],
        answer: 1,
      },
    ],
  },
  "cn-lifecycle": {
    questions: [
      {
        prompt: "NTP (Notice to Proceed) is:",
        options: [
          "The final completion certificate",
          "The owner's formal green light that starts contract time",
          "A type of change order",
          "The permit issued by the AHJ",
        ],
        answer: 1,
      },
      {
        prompt: "Order of precedence is:",
        options: [
          "The order subs are paid each month",
          "The contract's rule for which document governs when documents conflict",
          "The sequence of construction activities",
          "The ranking of RFIs by urgency",
        ],
        answer: 1,
      },
      {
        prompt: "When contract documents genuinely conflict and it's ambiguous, the PM should:",
        options: [
          "Guess and keep moving",
          "Issue an RFI rather than guess",
          "Always follow the drawings over the specs",
          "Ask the lowest subcontractor to decide",
        ],
        answer: 1,
      },
    ],
  },
  "cn-specs": {
    questions: [
      {
        prompt: "The three-part spec format is:",
        options: [
          "Cover, Body, Appendix",
          "Part 1 General (procedures), Part 2 Products (what's allowed), Part 3 Execution (how it's installed)",
          "Bid, Award, Closeout",
          "Design, Build, Operate",
        ],
        answer: 1,
      },
      {
        prompt: "Where do the submittal requirements for a trade typically live?",
        options: [
          "Part 3 Execution",
          "Part 1 General",
          "The drawings only",
          "Division 26 exclusively",
        ],
        answer: 1,
      },
      {
        prompt: "An \"or equal\" substitution requires:",
        options: [
          "Nothing — you may install any equivalent product",
          "A formal substitution request with comparative data, in the window Division 01 allows",
          "Only the subcontractor's verbal approval",
          "A change order from the owner in every case",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════ Building the Work ═══════════════════════
  "tech-sitework": {
    questions: [
      {
        prompt: "A proctor test establishes:",
        options: [
          "The bearing capacity of bedrock",
          "A soil's maximum density, against which field compaction is measured as a percentage",
          "The slope of a storm pipe",
          "The concrete mix strength",
        ],
        answer: 1,
      },
      {
        prompt: "When unsuitable soils (organics, wet clay, old fill) are found during grading, you should:",
        options: [
          "Quietly haul them off and hope",
          "Stop, document, notify, and price it as a change — it's the classic differing site condition",
          "Cover them and continue grading",
          "Ignore them if the geotech didn't mention them",
        ],
        answer: 1,
      },
      {
        prompt: "Site utilities generally go in:",
        options: [
          "Shallowest first",
          "By depth — deepest first, usually sanitary and storm since they are gravity systems with fixed slopes",
          "In any order the crew prefers",
          "After the building is fully framed",
        ],
        answer: 1,
      },
    ],
  },
  "tech-foundations": {
    questions: [
      {
        prompt: "A drilled pier (caisson) is used when:",
        options: [
          "Competent soil is right at the surface",
          "Surface soils can't carry the load, so load is taken down to competent soil or rock",
          "The building has no columns",
          "You want to avoid any inspections",
        ],
        answer: 1,
      },
      {
        prompt: "On the slab-on-grade checklist, underslab plumbing and electrical must be:",
        options: [
          "Installed after the pour",
          "Roughed in, tested, inspected, and surveyed before the pour",
          "Skipped entirely",
          "Left uninspected to save time",
        ],
        answer: 1,
      },
      {
        prompt: "Waterproofing differs from dampproofing in that:",
        options: [
          "They are identical",
          "Waterproofing resists hydrostatic pressure; dampproofing only resists moisture vapor",
          "Dampproofing is stronger than waterproofing",
          "Waterproofing is only used above grade",
        ],
        answer: 1,
      },
    ],
  },
  "tech-concrete": {
    questions: [
      {
        prompt: "The main driver of concrete strength is:",
        options: [
          "The color of the aggregate",
          "The water-cement ratio — more water is easier to place but weaker",
          "The time of day it is poured",
          "The number of trucks used",
        ],
        answer: 1,
      },
      {
        prompt: "Formwork and shoring design is:",
        options: [
          "The architect's responsibility",
          "The contractor's engineering responsibility",
          "Provided free by the ready-mix supplier",
          "Not required for elevated slabs",
        ],
        answer: 1,
      },
      {
        prompt: "The concrete rule every PM memorizes about post-tensioned (PT) slabs is:",
        options: [
          "PT slabs cure faster than normal slabs",
          "Never drill, core, or shoot anchors into a PT slab without locating tendons — a cut live tendon can exit the slab edge like a spear",
          "PT slabs need no testing",
          "PT slabs use no rebar at all",
        ],
        answer: 1,
      },
    ],
  },
  "tech-steel": {
    questions: [
      {
        prompt: "Why does structural steel typically lead the schedule?",
        options: [
          "Because it is the cheapest trade",
          "Because its detailing → review → fabrication → delivery → erection chain starts months before iron arrives, and detailing generates RFIs in bunches",
          "Because steel needs no submittals",
          "Because it is installed last",
        ],
        answer: 1,
      },
      {
        prompt: "Anchor bolts are set by the concrete contractor from steel's drawings, which makes them:",
        options: [
          "Irrelevant to steel erection",
          "The classic interface error — survey them before the columns ship",
          "The steel fabricator's sole responsibility to place",
          "Something to install after the columns are up",
        ],
        answer: 1,
      },
      {
        prompt: "SFRM (spray fireproofing) is a coordination trap because:",
        options: [
          "It is applied only outdoors",
          "Trades hanging pipe and duct knock it off daily, and an inspector finding bare steel above a finished ceiling reopens everything below",
          "It never needs inspection",
          "It replaces the need for rated assemblies",
        ],
        answer: 1,
      },
    ],
  },
  "tech-framing": {
    questions: [
      {
        prompt: "A UL assembly achieves its fire rating only when:",
        options: [
          "It is close enough to the listed build-up",
          "It is built exactly as listed — every layer, fastener, and detail",
          "An inspector signs off verbally",
          "It uses fire-treated lumber anywhere in the wall",
        ],
        answer: 1,
      },
      {
        prompt: "Brick veneer is best understood as:",
        options: [
          "A solid structural wall",
          "A drainage system — ties to the backup, a clean cavity, flashing with end dams, and weeps that actually drain",
          "A waterproof barrier with no cavity",
          "Purely decorative with no performance role",
        ],
        answer: 1,
      },
      {
        prompt: "Field-cutting or drilling engineered lumber outside the allowed zones:",
        options: [
          "Is fine as long as it's re-nailed",
          "Voids the member, not just the warranty",
          "Improves its load capacity",
          "Is required by most specs",
        ],
        answer: 1,
      },
    ],
  },
  "tech-envelope": {
    questions: [
      {
        prompt: "The envelope's four control layers are:",
        options: [
          "Brick, block, steel, glass",
          "Water, air, vapor, and thermal — each continuous around the whole building",
          "Roof, wall, floor, foundation",
          "Primer, paint, sealant, caulk",
        ],
        answer: 1,
      },
      {
        prompt: "The lesson's core insight about envelope failures is:",
        options: [
          "Products fail more than transitions",
          "Products rarely fail — transitions fail (roof-to-wall, wall-to-window, penetrations)",
          "Only cheap materials fail",
          "Failures only happen below grade",
        ],
        answer: 1,
      },
      {
        prompt: "Envelope water testing should happen:",
        options: [
          "Only at closeout",
          "Early, not at closeout — a leak found in month 4 is a detail fix; at occupancy it's an investigation",
          "Never — it damages the finished work",
          "Only after the punch list is complete",
        ],
        answer: 1,
      },
    ],
  },
  "tech-mep-coordination": {
    questions: [
      {
        prompt: "Every MEP rough-in wave ends in:",
        options: [
          "A billing milestone only",
          "A pressure test or inspection before cover — nothing closes up untested",
          "Immediate drywall installation",
          "A change order",
        ],
        answer: 1,
      },
      {
        prompt: "In the ceiling-space war, which system generally wins the coordination priority?",
        options: [
          "Electrical conduit",
          "Gravity pipe (it can't move), then duct (it's biggest), then everything else",
          "Sprinkler branch lines first",
          "Whatever is installed last",
        ],
        answer: 1,
      },
      {
        prompt: "Utility company coordination (transformers, meter sets, energization) runs on:",
        options: [
          "The GC's schedule",
          "The utility's timeline, not yours — start it months early and put commitments in writing",
          "No timeline; it's instant",
          "The subcontractor's convenience",
        ],
        answer: 1,
      },
    ],
  },
  "tech-fire": {
    questions: [
      {
        prompt: "A pre-action sprinkler system is used where:",
        options: [
          "Freezing is impossible and water is always wanted",
          "Accidental water discharge is intolerable (data rooms, archives) — it holds air until the alarm confirms fire",
          "There is no fire risk",
          "The building has no alarm system",
        ],
        answer: 1,
      },
      {
        prompt: "Firestopping requires that:",
        options: [
          "One product seals every penetration",
          "Each system is matched to the specific penetrant and assembly (a 2\" steel pipe and 2\" plastic pipe need different systems)",
          "Only the largest holes be sealed",
          "Sealing happen after the walls are painted",
        ],
        answer: 1,
      },
      {
        prompt: "The fire marshal's acceptance test is:",
        options: [
          "An optional courtesy inspection",
          "A hard CO gate — every device exercised, every interface proven; schedule it with slack",
          "Done only after occupancy",
          "Waived on sprinklered buildings",
        ],
        answer: 1,
      },
    ],
  },
  "tech-finishes": {
    questions: [
      {
        prompt: "Slab moisture testing before flooring matters because:",
        options: [
          "It sets the concrete strength",
          "Adhesive failures from wet slabs are five-figure problems with a two-hundred-dollar prevention",
          "It is required only on exterior slabs",
          "It determines the paint color",
        ],
        answer: 1,
      },
      {
        prompt: "Drywall finish Level 5 (skim coat) is specified where:",
        options: [
          "Any typical painted wall exists",
          "Critical/raking lighting washes the wall and would reveal imperfections",
          "The wall is fire-rated",
          "The wall is below grade",
        ],
        answer: 1,
      },
      {
        prompt: "The lesson treats protection of finished work as:",
        options: [
          "An afterthought the subs handle for free",
          "A real line item to budget — ram board, corner guards, and charging damage back with photos",
          "Unnecessary if the sequence is good",
          "Only the owner's concern",
        ],
        answer: 1,
      },
    ],
  },
  "tech-vertical-lv": {
    questions: [
      {
        prompt: "Why are elevators described as \"bought first and finished last\"?",
        options: [
          "They are cheap and quick to install",
          "They combine the longest procurement in the building with the last acceptance test before occupancy",
          "They require no interface work",
          "They are optional in most buildings",
        ],
        answer: 1,
      },
      {
        prompt: "MDF/IDF rooms need which conditions before racks land?",
        options: [
          "Nothing special",
          "Power, cooling, and dust-free finishes — earlier than anyone plans",
          "Only a locked door",
          "Final carpet and paint only",
        ],
        answer: 1,
      },
      {
        prompt: "The DAS/ERRC surprise is that emergency-responder radio coverage:",
        options: [
          "Can be tested at any time in design",
          "Can only be tested in the real, finished building — and if it fails, a DAS lands on the critical path to occupancy",
          "Is never required by jurisdictions",
          "Is included in every base contract",
        ],
        answer: 1,
      },
    ],
  },
  "tech-testing-cx": {
    questions: [
      {
        prompt: "The CxA (commissioning agent) is:",
        options: [
          "The GC's superintendent",
          "The owner's verifier that systems are designed, installed, and perform per the owner's project requirements",
          "The building department inspector",
          "The concrete testing lab",
        ],
        answer: 1,
      },
      {
        prompt: "Special inspections (IBC Chapter 17) report to:",
        options: [
          "The subcontractor who did the work",
          "The building official — third-party verification hired by the owner; the final report is a CO prerequisite",
          "The design architect only",
          "Nobody — they are informational",
        ],
        answer: 1,
      },
      {
        prompt: "The classic commissioning bottleneck is:",
        options: [
          "The concrete cylinders",
          "Controls — functional tests need finished systems, permanent power, and completed controls programming",
          "The roofing warranty",
          "The punch list",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════════ Site & Civil ═══════════════════════════
  "sc-site-analysis": {
    questions: [
      {
        prompt: "An easement is:",
        options: [
          "A tax on the property",
          "Someone else's legal right to use part of the site (utilities, access, drainage) — generally a no-build zone",
          "A type of foundation",
          "The building's setback from the street",
        ],
        answer: 1,
      },
      {
        prompt: "Why is historical use the best predictor of underground surprises?",
        options: [
          "It isn't — soil is always uniform",
          "Old foundations, wells, buried tanks, and uncontrolled fill from prior uses show up in your dirt",
          "Because it sets the zoning",
          "Because it determines the floodplain",
        ],
        answer: 1,
      },
      {
        prompt: "When the excavator hits something the documents didn't show, that's:",
        options: [
          "Normal — keep digging",
          "A differing site condition: stop, photograph, notify, and paper it while the hole is open",
          "The surveyor's mistake to fix",
          "An automatic owner cost with no documentation needed",
        ],
        answer: 1,
      },
    ],
  },
  "sc-grading": {
    questions: [
      {
        prompt: "A spot grade is:",
        options: [
          "A general slope callout",
          "A precise design elevation at a point (pad corner, structure rim, pavement edge) that overrides contour interpolation",
          "The average grade of the whole site",
          "The color of the topsoil",
        ],
        answer: 1,
      },
      {
        prompt: "A \"balanced site\" grading design is one where:",
        options: [
          "The building is centered on the lot",
          "Cut volume ≈ fill volume, so no dirt is imported or exported",
          "All slopes are exactly 3:1",
          "The site is perfectly flat",
        ],
        answer: 1,
      },
      {
        prompt: "The Limits of Disturbance (LOD) line means:",
        options: [
          "The property boundary",
          "The line beyond which nothing is cleared, graded, driven on, or stockpiled — including tree save areas",
          "The maximum building height",
          "The edge of the parking lot",
        ],
        answer: 1,
      },
    ],
  },
  "sc-esc": {
    questions: [
      {
        prompt: "The NPDES permit is:",
        options: [
          "A building permit for the structure",
          "The federal/state stormwater discharge permit construction sites operate under — the legal basis for the SWPPP",
          "An electrical permit",
          "A permit to occupy the building",
        ],
        answer: 1,
      },
      {
        prompt: "Erosion and sediment control is described as:",
        options: [
          "An optional best practice",
          "A regulatory compliance obligation with inspection regimes and per-day fines",
          "A one-time install at the start",
          "The architect's responsibility",
        ],
        answer: 1,
      },
      {
        prompt: "In an enforcement action, what makes the difference between \"a device failed and we fixed it\" and \"nobody was watching\"?",
        options: [
          "The size of the sediment basin",
          "The SWPPP inspection log — inspections on a fixed frequency plus after every qualifying rain event",
          "The color of the silt fence",
          "The number of workers on site",
        ],
        answer: 1,
      },
    ],
  },
  "sc-stormwater": {
    questions: [
      {
        prompt: "Detention vs. retention ponds:",
        options: [
          "Are the same thing",
          "Detention holds runoff briefly and releases it slowly; retention holds a permanent pool",
          "Both hold a permanent pool",
          "Neither is used in modern design",
        ],
        answer: 1,
      },
      {
        prompt: "Why is the pond a poor place to \"find\" site area during value engineering?",
        options: [
          "Ponds are cheap to shrink",
          "Peak flow scales with impervious surface (Q=CiA), so more paving requires a bigger pond, not a smaller one",
          "Ponds have no regulatory requirements",
          "Ponds don't affect runoff",
        ],
        answer: 1,
      },
      {
        prompt: "How does construction most often kill infiltration systems (like bioretention)?",
        options: [
          "By planting too many trees",
          "By GC traffic — equipment compacting infiltration areas or using cells as sediment traps during grading",
          "By testing them too early",
          "By fencing them off",
        ],
        answer: 1,
      },
    ],
  },
  "sc-utilities": {
    questions: [
      {
        prompt: "An invert is:",
        options: [
          "The top of a manhole cover",
          "The inside-bottom elevation of a pipe at a structure — the number gravity systems live and die by",
          "A type of backflow preventer",
          "The slope of a driveway",
        ],
        answer: 1,
      },
      {
        prompt: "Why do gravity sewers go in first and deepest?",
        options: [
          "They are the cheapest to install",
          "Their inverts are fixed by designed slopes and math, so everything else must route around them",
          "They are pressurized and flexible",
          "They require no inspection",
        ],
        answer: 1,
      },
      {
        prompt: "For a critical utility crossing, \"811 locates\" should be supplemented by:",
        options: [
          "Nothing — the marks are exact",
          "Potholing — physically exposing the utility to verify, because marks are approximate",
          "A change order",
          "A pressure test",
        ],
        answer: 1,
      },
    ],
  },
  "sc-streets-parking": {
    questions: [
      {
        prompt: "A turning template on the plans represents:",
        options: [
          "The parking stall dimensions",
          "The swept path of a design vehicle (fire truck, semi) — the reason drive aisles and cul-de-sacs are sized as they are",
          "The building footprint",
          "The stormwater flow path",
        ],
        answer: 1,
      },
      {
        prompt: "Restriping a parking lot to \"find\" more spaces is:",
        options: [
          "A routine field decision",
          "Not a field decision — counts come from zoning minimums negotiated at entitlement",
          "Always allowed if stalls fit",
          "The striping sub's call",
        ],
        answer: 1,
      },
      {
        prompt: "Pavement is described as failing:",
        options: [
          "From the surface down",
          "From below — subgrade prep, base course, and compaction determine longevity",
          "Only from weather",
          "Only from heavy trucks",
        ],
        answer: 1,
      },
    ],
  },
  "sc-pedestrian-ada": {
    questions: [
      {
        prompt: "The accessible route is:",
        options: [
          "Any sidewalk on the site",
          "The continuous, compliant path from parking/transit/public way to the accessible entrance — every inch must comply",
          "Only the ramp at the front door",
          "A route only wheelchairs may use",
        ],
        answer: 1,
      },
      {
        prompt: "The maximum cross slope on an accessible route is:",
        options: ["5%", "2%", "8.33%", "There is no limit"],
        answer: 1,
      },
      {
        prompt: "The accessible route is called the most-failed sitework item because:",
        options: [
          "Crews refuse to build it",
          "It fails in fractions — a walk at 2.4% cross slope or a running slope creeping past 5% fails the whole route, and the fix is demolition",
          "It is never inspected",
          "It costs the most money",
        ],
        answer: 1,
      },
    ],
  },
  "sc-landscape": {
    questions: [
      {
        prompt: "The critical root zone is:",
        options: [
          "The depth a tree is planted",
          "The protected circle around a tree (roughly 1 ft radius per inch of trunk diameter) where grading, trenching, and traffic cause slow death",
          "The nursery where the tree was grown",
          "The irrigation zone for the lawn",
        ],
        answer: 1,
      },
      {
        prompt: "The #1 preventable killer of newly planted trees is:",
        options: [
          "Too much water",
          "Planting depth — a root flare buried below grade suffocates the tree slowly",
          "Sunlight",
          "Using the wrong mulch color",
        ],
        answer: 1,
      },
      {
        prompt: "Tree preservation \"fails silently\" through:",
        options: [
          "Over-watering",
          "Fill piled over roots, a trench through a root zone, or equipment parked in the root zone — death in two summers",
          "Planting too many trees",
          "Fencing the trees off",
        ],
        answer: 1,
      },
    ],
  },
  "sc-sensitive-areas": {
    questions: [
      {
        prompt: "A jurisdictional wetland is determined by:",
        options: [
          "Whether it looks wet on the day you visit",
          "Soils, hydrology, and vegetation under federal (Corps of Engineers) authority",
          "The owner's preference",
          "The size of the parcel",
        ],
        answer: 1,
      },
      {
        prompt: "A Section 404 permit is required to:",
        options: [
          "Build any structure",
          "Fill or disturb jurisdictional waters/wetlands — with mitigation obligations attached",
          "Pull an electrical permit",
          "Occupy the building",
        ],
        answer: 1,
      },
      {
        prompt: "Filling a wetland beyond a 404 permit or clearing a required buffer can:",
        options: [
          "Be fixed with a small fine and no delay",
          "Trigger enforcement that stops the whole project and imposes restoration plus mitigation at multiples of the area damaged",
          "Be ignored if unintentional",
          "Only affect the landscape budget",
        ],
        answer: 1,
      },
    ],
  },
  "sc-environmental": {
    questions: [
      {
        prompt: "A Phase I ESA:",
        options: [
          "Includes soil and groundwater sampling",
          "Is a records-and-walkthrough assessment identifying 'recognized environmental conditions' — no sampling",
          "Is the remediation itself",
          "Is only done after construction",
        ],
        answer: 1,
      },
      {
        prompt: "On a brownfield, remediation is usually:",
        options: [
          "Total removal of all contamination",
          "Risk-based — contamination capped under buildings and pavement, so your excavation can breach the remedy",
          "Never necessary",
          "The GC's design responsibility",
        ],
        answer: 1,
      },
      {
        prompt: "Contaminated spoil is:",
        options: [
          "Clean fill you can reuse",
          "Waste with a manifest — disposal costs an order of magnitude above clean haul-off",
          "The same cost as normal dirt",
          "Always left in place",
        ],
        answer: 1,
      },
    ],
  },
  "sc-entitlements": {
    questions: [
      {
        prompt: "Entitlements are:",
        options: [
          "The GC's profit on a project",
          "The bundle of public approvals (rezoning, site plan approval, variances) that let the project exist in its current form",
          "A type of insurance",
          "The subcontractor's scope letters",
        ],
        answer: 1,
      },
      {
        prompt: "Conditions of approval are:",
        options: [
          "Suggestions the owner may ignore",
          "Project-specific obligations attached to the entitlement — enforceable like code",
          "Internal GC checklists",
          "Only relevant during design",
        ],
        answer: 1,
      },
      {
        prompt: "A field idea to move the dumpster enclosure closer to the property line may be a non-starter because:",
        options: [
          "It costs too much",
          "It could violate a public commitment (setback/buffer) recorded in the entitlement, needing re-approval",
          "Dumpsters are never shown on plans",
          "The sub won't agree",
        ],
        answer: 1,
      },
    ],
  },
  "sc-design-pm": {
    questions: [
      {
        prompt: "\"Contractor to verify\" and \"refer to structural\" in RFI answers are best understood as:",
        options: [
          "Lazy evasions",
          "Risk allocations — designers answer to their standard of care and avoid absorbing means-and-methods risk",
          "Signs the designer is incompetent",
          "Automatic change orders",
        ],
        answer: 1,
      },
      {
        prompt: "If a design team's response times suddenly crater, one likely cause is:",
        options: [
          "The weather",
          "A commercial problem — an unpaid or fee-exhausted designer answers slowly; the fix runs through the owner",
          "Too many drawings",
          "The GC being too polite",
        ],
        answer: 1,
      },
      {
        prompt: "The productive posture toward the design team is:",
        options: [
          "Grind them down early to set the tone",
          "Structured empathy — batch questions, propose solutions in RFIs, keep a response-time log, route fee problems to the owner",
          "Send ten vague RFIs at once",
          "Avoid all contact until closeout",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════════ MEP Systems ═══════════════════════════
  "mep-activity-pattern": {
    questions: [
      {
        prompt: "The universal MEP activity chain runs, in order:",
        options: [
          "Test → approve → deliver → connect → commission",
          "Approval → delivery → first fix → second fix → connect → test → commission → handover",
          "First fix → second fix → approval → delivery",
          "Commission → test → rough-in → submittal",
        ],
        answer: 1,
      },
      {
        prompt: "BWIC (builder's work in connection) is:",
        options: [
          "A type of fire alarm device",
          "The GC-scope work MEP depends on (openings, sleeves, pads, shafts) — the classic 'not my scope' gap",
          "A subcontractor bond",
          "A commissioning report",
        ],
        answer: 1,
      },
      {
        prompt: "How does man-hour thinking help at pay-app review?",
        options: [
          "It doesn't — percent complete is always accurate",
          "Installed quantities are facts; a 80% billed claim can be checked against the pounds/joints a floor walk would actually find",
          "It sets the retainage rate",
          "It determines the submittal schedule",
        ],
        answer: 1,
      },
    ],
  },
  "mep-fire-suppression": {
    questions: [
      {
        prompt: "The default sprinkler system type is:",
        options: [
          "Dry pipe",
          "Wet pipe — piping always full of water",
          "Pre-action",
          "Deluge",
        ],
        answer: 1,
      },
      {
        prompt: "A painted sprinkler head is:",
        options: [
          "Perfectly fine once dry",
          "A replaced head — they cannot be cleaned; painting after heads are installed is a sequencing trap",
          "Required by NFPA 13",
          "Only a cosmetic issue",
        ],
        answer: 1,
      },
      {
        prompt: "Sprinkler shop drawings typically carry a PE stamp because:",
        options: [
          "The GC requires it for billing",
          "Sprinkler design is usually delegated engineering — real review time is needed",
          "The owner draws them",
          "They are the same as the architectural RCP",
        ],
        answer: 1,
      },
    ],
  },
  "mep-plumbing": {
    questions: [
      {
        prompt: "Underground sanitary/storm rough-in sits:",
        options: [
          "Off the critical path — it can happen anytime",
          "Directly on the critical path — nothing pours until it's in, tested, and inspected",
          "After the building is framed",
          "During trim-out",
        ],
        answer: 1,
      },
      {
        prompt: "The waste-and-vent system exists because:",
        options: [
          "Drainage needs air behind the water to keep traps from siphoning",
          "It carries drinking water",
          "It provides heating",
          "It is purely decorative",
        ],
        answer: 0,
      },
      {
        prompt: "ADA fixture mounting heights and clearances are effectively determined:",
        options: [
          "At final inspection with a tape measure",
          "Behind the wall, months earlier — set by the carrier installed during rough-in",
          "By the painter",
          "By the owner after occupancy",
        ],
        answer: 1,
      },
    ],
  },
  "mep-hvac-air": {
    questions: [
      {
        prompt: "Pressure/sealing class on a duct run comes from:",
        options: [
          "The installer's preference",
          "The SMACNA construction standard matched to system pressure — verified by leak testing",
          "The color of the duct wrap",
          "The RCP only",
        ],
        answer: 1,
      },
      {
        prompt: "Every fire/smoke damper (FSD) needs:",
        options: [
          "No maintenance access",
          "An access door — every missed access door is a punch item",
          "A separate electrical meter",
          "To be welded shut",
        ],
        answer: 1,
      },
      {
        prompt: "If permanent HVAC must run during construction, it should run on:",
        options: [
          "Final filters",
          "Construction filters — running final filters (or none) on construction dust contaminates coils and voids warranties",
          "No filters, to save cost",
          "Whatever filter is handy",
        ],
        answer: 1,
      },
    ],
  },
  "mep-hvac-water": {
    questions: [
      {
        prompt: "Hydronic piping is tested before insulation because:",
        options: [
          "Insulation makes testing easier",
          "An insulated leak is a hidden leak",
          "The insulation must cure first",
          "Testing is optional after insulation",
        ],
        answer: 1,
      },
      {
        prompt: "A housekeeping pad is:",
        options: [
          "A cleaning schedule",
          "The concrete pad under equipment — GC scope, needed before the equipment that sits on it",
          "A type of vibration isolator sold with the chiller",
          "An electrical grounding mat",
        ],
        answer: 1,
      },
      {
        prompt: "The lesson singles out the condensate line because:",
        options: [
          "It carries the most water",
          "Sloped or trapped wrong, this humble small pipe becomes the building's most reliable source of ceiling stains",
          "It is the most expensive component",
          "It never causes problems",
        ],
        answer: 1,
      },
    ],
  },
  "mep-bms": {
    questions: [
      {
        prompt: "The BMS points list is best treated as:",
        options: [
          "An optional reference",
          "The scope document — a point missing from the list is a function missing from the building, found at commissioning",
          "A billing summary",
          "The same as the RCP",
        ],
        answer: 1,
      },
      {
        prompt: "Point-to-point checkout is:",
        options: [
          "Balancing airflows",
          "Verifying every sensor and command wire end-to-end before functional testing",
          "The fire alarm acceptance test",
          "A concrete inspection",
        ],
        answer: 1,
      },
      {
        prompt: "Why do controls get squeezed at the end of the job?",
        options: [
          "They are unimportant",
          "They need installed equipment, permanent power, and completed wiring first — so every upstream slip compresses the controls window while the CO date holds still",
          "The controls sub always starts late by choice",
          "The owner delays them",
        ],
        answer: 1,
      },
    ],
  },
  "mep-electrical-distribution": {
    questions: [
      {
        prompt: "The single-line diagram shows:",
        options: [
          "The daily crew assignments",
          "The one-page map of the power system: service → transformer → switchgear → panels → branch circuits",
          "The plumbing risers",
          "The fire alarm matrix",
        ],
        answer: 1,
      },
      {
        prompt: "NEC 110.26 is the reason:",
        options: [
          "Conduit must be painted",
          "Electrical rooms are the size they are — the working-clearance rule in front of equipment, and a field change that's never allowed",
          "Switchgear is long-lead",
          "Generators need fuel tanks",
        ],
        answer: 1,
      },
      {
        prompt: "The temporary-to-permanent power transition is described as:",
        options: [
          "A minor closeout task",
          "The schedule's master gate — elevators, HVAC equipment, and controls checkout begin only on permanent power",
          "Irrelevant to the CO",
          "The utility's problem alone",
        ],
        answer: 1,
      },
    ],
  },
  "mep-low-voltage": {
    questions: [
      {
        prompt: "Low voltage splits into two schedules:",
        options: [
          "Design and construction",
          "Pathways (tray, conduit, sleeves, firestopping) during rough-in, and cable pulls/terminations/testing near the end",
          "Rough-in and demolition",
          "Backbone and retainage",
        ],
        answer: 1,
      },
      {
        prompt: "The trap in low-voltage scheduling is:",
        options: [
          "Pulling cable too early",
          "Treating the whole scope as 'late work' and missing the pathway window — then core-drilling rated floors in a finished building",
          "Installing too many sleeves",
          "Testing the cable twice",
        ],
        answer: 1,
      },
      {
        prompt: "Service providers (internet, phone, cable) run on:",
        options: [
          "The GC's construction schedule",
          "Carrier timelines that answer to no construction schedule — engage them at buyout and hold commitments in writing",
          "No timeline; they show up instantly",
          "The electrician's schedule",
        ],
        answer: 1,
      },
    ],
  },
  "mep-security-fire-alarm": {
    questions: [
      {
        prompt: "The \"door hardware triangle\" refers to:",
        options: [
          "Three types of door closers",
          "Division 8 hardware + Division 26 power + Division 28 controls on the same opening — the most fragmented interface in the building",
          "A triangular door frame",
          "Three subcontractors bidding one door",
        ],
        answer: 1,
      },
      {
        prompt: "The sequence-of-operations matrix should be agreed and signed off:",
        options: [
          "During the acceptance test",
          "During submittals — it's both the wiring scope and the test script",
          "After occupancy",
          "Only if the fire marshal asks",
        ],
        answer: 1,
      },
      {
        prompt: "The fire alarm acceptance test controls the CO more than any other event because:",
        options: [
          "It is the cheapest test",
          "It is a 100% test at the end of a dependency chain, inheriting every upstream slip; a failed witnessed test costs a reschedule on the fire marshal's calendar",
          "It can be skipped on small buildings",
          "It happens first, before rough-in",
        ],
        answer: 1,
      },
    ],
  },
  "mep-coordination-scheduling": {
    questions: [
      {
        prompt: "The trade-stacking rhythm on a repetitive floor is:",
        options: [
          "Finish → frame → trim → rough-in",
          "Frame → MEP rough-in → inspect → cover → finish → trim, with trades leapfrogging to the next zone",
          "Commission → test → pour",
          "Trim → cover → inspect → frame",
        ],
        answer: 1,
      },
      {
        prompt: "The \"accordion effect\" is:",
        options: [
          "A type of expansion joint",
          "When one trade slips a zone and every following trade compresses, stacks, and loses productivity",
          "A ductwork fabrication method",
          "A billing dispute",
        ],
        answer: 1,
      },
      {
        prompt: "In coordination, which trade usually draws first?",
        options: [
          "Sprinkler",
          "Duct — it's biggest and least flexible, so others fit around it",
          "Low voltage",
          "Whoever bids lowest",
        ],
        answer: 1,
      },
    ],
  },
  "mep-startup-cx": {
    questions: [
      {
        prompt: "Testing, startup, and commissioning answer, respectively:",
        options: [
          "Does it perform / does it run / does it hold",
          "Does it hold (or is it wired right) / does it run / does it perform as designed",
          "All three ask the same question",
          "Does it cost too much / is it late / is it approved",
        ],
        answer: 1,
      },
      {
        prompt: "Hydronic systems must be flushed before equipment sees water because:",
        options: [
          "Flushing is only for aesthetics",
          "Skipping it puts construction debris into chiller tubes and coil passages — a warranty fight you lose",
          "The water needs to be hot",
          "It speeds up commissioning",
        ],
        answer: 1,
      },
      {
        prompt: "The \"beneficial use\" warranty trap is that running permanent HVAC early can:",
        options: [
          "Extend the warranty automatically",
          "Start warranty clocks at first operation instead of at substantial completion — negotiate it deliberately",
          "Never affect the warranty",
          "Only affect the electrical scope",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════ Contracts & Commercial ═══════════════════════
  "com-delivery": {
    questions: [
      {
        prompt: "In Design-Bid-Build, the relationship often starts adversarial by structure because:",
        options: [
          "The GC designed the project",
          "The GC had no design input, so document gaps become RFIs and change orders",
          "The owner holds no contracts",
          "There is no architect",
        ],
        answer: 1,
      },
      {
        prompt: "In Design-Build:",
        options: [
          "The owner contracts separately with designer and builder",
          "One entity holds both design and construction, so design liability lives inside your team",
          "The CM holds no risk",
          "The architect judges the contractor's payments",
        ],
        answer: 1,
      },
      {
        prompt: "In every delivery hybrid, the two questions that locate the risk are:",
        options: [
          "Who is cheapest, and who is fastest?",
          "Who holds design liability, and at what moment does price become a commitment?",
          "How many subs, and how many RFIs?",
          "What is the retainage, and what is the fee?",
        ],
        answer: 1,
      },
    ],
  },
  "com-documents": {
    questions: [
      {
        prompt: "AIA A201 is:",
        options: [
          "The lump-sum agreement with the price",
          "The General Conditions — the rulebook for RFIs, changes, payment, claims, and termination",
          "The pay application form",
          "The change order form",
        ],
        answer: 1,
      },
      {
        prompt: "G702/G703 are:",
        options: [
          "The general conditions",
          "The standard pay application — G702 the summary/certification, G703 the schedule-of-values continuation sheet",
          "The subcontract agreement",
          "The substantial completion certificate",
        ],
        answer: 1,
      },
      {
        prompt: "The danger with a \"manuscript\" (custom/amended) contract is:",
        options: [
          "It is always more contractor-friendly",
          "The amendments shift the standard form's balance one strikethrough at a time — never assume an 'AIA contract' has AIA terms",
          "It cannot be enforced",
          "It has no general conditions",
        ],
        answer: 1,
      },
    ],
  },
  "com-clauses": {
    questions: [
      {
        prompt: "The discipline around a notice provision is:",
        options: [
          "Send notice only when you're certain of the full cost",
          "When in doubt, send written notice preserving rights — you can withdraw a claim but never un-miss a deadline",
          "Notice is optional if the owner already knows",
          "Wait until the dispute is resolved",
        ],
        answer: 1,
      },
      {
        prompt: "Pay-if-paid differs from pay-when-paid because:",
        options: [
          "They are identical",
          "Pay-if-paid transfers risk (the sub eats owner insolvency where enforceable); pay-when-paid only affects timing",
          "Pay-when-paid means the sub is never paid",
          "Pay-if-paid is always illegal",
        ],
        answer: 1,
      },
      {
        prompt: "A Construction Change Directive (CCD) is:",
        options: [
          "A fully priced and agreed change",
          "The owner's unilateral order to proceed with changed work before price is agreed — you perform under protest-and-track rules",
          "A subcontractor's bid",
          "A closeout document",
        ],
        answer: 1,
      },
    ],
  },
  "com-sub-admin": {
    questions: [
      {
        prompt: "Most subcontract disputes are:",
        options: [
          "Safety disputes",
          "Scope disputes — most of which were preventable at buyout with a tight exhibit and a descoping meeting",
          "Insurance disputes",
          "Weather disputes",
        ],
        answer: 1,
      },
      {
        prompt: "When issuing a notice of default to a failing sub, you must:",
        options: [
          "Skip the cure period to save time",
          "Follow the subcontract clause exactly — a botched default becomes the sub's wrongful-termination claim",
          "Terminate immediately without notice",
          "Wait until the sub finishes",
        ],
        answer: 1,
      },
      {
        prompt: "Proper backcharge discipline includes:",
        options: [
          "Surprising the sub with a line on the pay app",
          "Notifying before doing the work (except emergencies), documenting cost, and deducting via change order",
          "Never documenting the cost",
          "Deducting a round number with no tickets",
        ],
        answer: 1,
      },
    ],
  },
  "com-liens-bonds": {
    questions: [
      {
        prompt: "A mechanic's lien is:",
        options: [
          "A tax lien filed by the government",
          "A statutory security interest in the improved property for unpaid work — deadline-driven and procedural",
          "An insurance policy",
          "A type of change order",
        ],
        answer: 1,
      },
      {
        prompt: "You should never sign an unconditional waiver:",
        options: [
          "At the end of the job",
          "For money you haven't actually received — it says paid, and courts tend to believe it",
          "For a conditional progress payment",
          "On public work",
        ],
        answer: 1,
      },
      {
        prompt: "On public projects, payment bonds (Miller Act / Little Miller Acts) exist because:",
        options: [
          "Public work has no subcontractors",
          "Public property can't be liened, so payment bonds stand in",
          "Bonds are cheaper than liens",
          "The government prefers paperwork",
        ],
        answer: 1,
      },
    ],
  },
  "com-claims": {
    questions: [
      {
        prompt: "In the delay matrix, an owner-caused critical-path delay is typically:",
        options: [
          "Excusable only (time, no money)",
          "Compensable (time + money)",
          "Neither time nor money",
          "The contractor's fault",
        ],
        answer: 1,
      },
      {
        prompt: "Constructive acceleration occurs when:",
        options: [
          "The owner orders and pays for recovery",
          "You requested time for an excusable delay, were denied, and accelerated to avoid LDs — compensable only with a documented sequence",
          "Weather speeds up the work",
          "The sub volunteers to work overtime",
        ],
        answer: 1,
      },
      {
        prompt: "Claims are won by:",
        options: [
          "The loudest argument at mediation",
          "The boring contemporaneous records made when nobody was fighting — daily logs, dated photos, timely notice, honest schedule updates",
          "Reconstructed records made for litigation",
          "The largest legal team",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════════ Professional Skills ═══════════════════════
  "pf-financial": {
    questions: [
      {
        prompt: "To achieve a 10% margin, you must mark cost up by:",
        options: [
          "Exactly 10% (multiply by 1.10)",
          "About 11.1% (divide cost by 0.90) — margin and markup are not the same",
          "20%",
          "5%",
        ],
        answer: 1,
      },
      {
        prompt: "The WIP report compares:",
        options: [
          "Two subcontractors' bids",
          "Earned (cost-based percent complete × contract) against billed — revealing overbilling, underbilling, and fade",
          "The schedule against the budget",
          "Retainage against fee",
        ],
        answer: 1,
      },
      {
        prompt: "\"Fade\" is:",
        options: [
          "A paint defect",
          "A projected-fee number that declines month after month — CFOs pattern-match it instantly",
          "The loss of a subcontractor",
          "A drop in the schedule float",
        ],
        answer: 1,
      },
    ],
  },
  "pf-estimating": {
    questions: [
      {
        prompt: "A quantity takeoff is:",
        options: [
          "The markup added to cost",
          "Measuring the work from the drawings (CY of concrete, SF of drywall, LF of pipe) — the foundation under every price",
          "A subcontractor's bid",
          "The general conditions estimate",
        ],
        answer: 1,
      },
      {
        prompt: "Why hold the estimate-to-budget handoff meeting early?",
        options: [
          "It is a formality with no value",
          "The estimator's assumptions are perishable — sit with them before they mentally move to the next pursuit",
          "To set the retainage rate",
          "To choose the project's paint colors",
        ],
        answer: 1,
      },
      {
        prompt: "A scope gap is:",
        options: [
          "Extra profit on a trade",
          "Work that fell between bid packages — every trade excluded it, and now the GC's fee pays for it",
          "A hole in the drawings' revision cloud",
          "A gap in the schedule float",
        ],
        answer: 1,
      },
    ],
  },
  "pf-leadership": {
    questions: [
      {
        prompt: "The \"relationship bank account\" with a sub means:",
        options: [
          "A joint checking account",
          "A running balance of fairness and follow-through — you make withdrawals (schedule pushes) against deposits (paying on time, backing them when right)",
          "The sub's retainage held by the GC",
          "A performance bond",
        ],
        answer: 1,
      },
      {
        prompt: "The PM/super partnership rule for handling disagreement is:",
        options: [
          "Argue it out in front of the subs",
          "Disagree in private, present one plan in public — subs exploit daylight between PM and super within a week",
          "Never disagree",
          "Let the subs decide",
        ],
        answer: 1,
      },
      {
        prompt: "The rule for managing up is:",
        options: [
          "Only report good news",
          "No surprises — your PX should hear every material risk from you first, framed with a plan",
          "Bury bad news until it's unfixable",
          "Escalate everything immediately without a recommendation",
        ],
        answer: 1,
      },
    ],
  },
  "pf-communication": {
    questions: [
      {
        prompt: "A confirming email is:",
        options: [
          "A monthly status report",
          "The 'per our conversation' follow-up that converts verbal directives into record — the highest-value writing habit in construction",
          "A notice of default",
          "The pay application cover letter",
        ],
        answer: 1,
      },
      {
        prompt: "Construction email should be written as if:",
        options: [
          "It will be deleted next week",
          "It will be read aloud in a deposition — facts and dates, no anger, one topic per thread",
          "Only the recipient will ever see it",
          "Grammar doesn't matter",
        ],
        answer: 1,
      },
      {
        prompt: "The rule for delivering bad news is:",
        options: [
          "Wait until it's unfixable so you're certain",
          "Deliver it as soon as it's real, lead with the fact and number, and bring options with a recommendation",
          "Let the owner discover it independently",
          "Bury it on page six of the report",
        ],
        answer: 1,
      },
    ],
  },
  "pf-codes": {
    questions: [
      {
        prompt: "Nearly everything in the IBC keys off which two classifications set early in design?",
        options: [
          "Budget and schedule",
          "Occupancy (what happens inside) and construction type (what it's built of)",
          "Owner and architect",
          "Cost code and cost type",
        ],
        answer: 1,
      },
      {
        prompt: "ADA violations are described as failing:",
        options: [
          "In whole feet at the start of the job",
          "In fractions of inches at the end of the job — unless someone measures during rough-in",
          "Only on exterior work",
          "Only when an inspector is hostile",
        ],
        answer: 1,
      },
      {
        prompt: "\"The IBC says\" is only the start of the answer because:",
        options: [
          "The IBC is rarely used",
          "Local amendments — the state or city version of the model code is the one your inspector carries",
          "The IBC has no fire provisions",
          "Codes don't apply to renovations",
        ],
        answer: 1,
      },
    ],
  },
  "pf-industry-ethics": {
    questions: [
      {
        prompt: "GC fees on competitively bid work are often:",
        options: [
          "25–40%",
          "Thin — often 2–5% — so the money is made or lost in execution",
          "Fixed by law at 15%",
          "Higher than subcontractor margins by design",
        ],
        answer: 1,
      },
      {
        prompt: "Bid shopping is:",
        options: [
          "Comparing material prices at suppliers",
          "Using one sub's bid to squeeze others after bid day — short-term savings, long-term poison to the sub market",
          "A required buyout step",
          "The same as bid leveling",
        ],
        answer: 1,
      },
      {
        prompt: "On document integrity, the lesson's absolute rule is:",
        options: [
          "Refresh daily logs before litigation to make them clearer",
          "Never backdate, never alter a record after the fact, never 'refresh' a daily log for litigation",
          "Alter records only if the owner agrees",
          "Backdating is fine within 30 days",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════ Preconstruction & Field Ops ═══════════════════
  "fo-geotech": {
    questions: [
      {
        prompt:
          "A geotech report shows the water table at 4 ft, but your foundation excavation goes to 8 ft. What does that add to the estimate?",
        options: [
          "Nothing — the water table only matters for landscaping",
          "Dewatering (wellpoints), trench shoring, watertight foundation detailing, and likely imported structural backfill",
          "A taller crane and extra scaffolding",
          "Only a Level 5 drywall finish",
        ],
        answer: 1,
      },
      {
        prompt: "The OSHA soil classification (Type A / B / C) in a geotech report primarily governs:",
        options: [
          "The color of the concrete",
          "How an excavation must be sloped, benched, or shored so it doesn't cave in",
          "The paint schedule",
          "The submittal routing order",
        ],
        answer: 1,
      },
      {
        prompt: "Low soil bearing capacity most directly drives the decision to:",
        options: [
          "Use shallow spread footings to save money",
          "Move to deep foundations such as driven piles or drilled caissons",
          "Skip the geotech report",
          "Add more parking",
        ],
        answer: 1,
      },
    ],
  },
  "fo-takeoffs": {
    questions: [
      {
        prompt: "Why does the GC perform its own material takeoff instead of trusting the subs' bids?",
        options: [
          "To replace the architect's drawings",
          "To create an independent baseline that exposes scope gaps and underbidding, and to price change orders and check the SOV",
          "It's only required on residential jobs",
          "To avoid having to level bids",
        ],
        answer: 1,
      },
      {
        prompt: "Concrete quantities in a takeoff are typically measured in:",
        options: ["Square feet", "Linear feet", "Cubic yards", "Tons"],
        answer: 2,
      },
      {
        prompt: "A subcontractor bid comes in far below your quantity-based estimate. The most likely explanation is:",
        options: [
          "You got a genuine bargain — award it immediately",
          "Missing scope or a deliberate underbid, which is a red flag to investigate before award",
          "The drawings are wrong",
          "Retainage was doubled",
        ],
        answer: 1,
      },
    ],
  },
  "fo-constructability-ve": {
    questions: [
      {
        prompt: "A constructability review is looking for:",
        options: [
          "Cheaper paint colors",
          "Design elements that are physically impossible to build or impossible to sequence",
          "Overbilling on pay apps",
          "Missing lien waivers",
        ],
        answer: 1,
      },
      {
        prompt: "True value engineering (VE) must preserve which of the following?",
        options: [
          "The lowest possible first cost above all else",
          "Function, structural safety, and design intent / life-cycle performance",
          "The original subcontractor list",
          "The exact original materials",
        ],
        answer: 1,
      },
      {
        prompt: "When is a constructability or VE review most valuable?",
        options: [
          "After the trade has installed the work",
          "During preconstruction, while a change is still an eraser mark on paper",
          "At the warranty walk",
          "Only after substantial completion",
        ],
        answer: 1,
      },
    ],
  },
  "fo-div00-01": {
    questions: [
      {
        prompt:
          "Where would you look for the exact rules on how a weather-delay must be documented and submitted?",
        options: [
          "The architectural floor plans",
          "MasterFormat Division 01 (General Requirements)",
          "The landscape drawings",
          "The geotech report",
        ],
        answer: 1,
      },
      {
        prompt: "Division 00 of the Project Manual primarily covers:",
        options: [
          "Concrete testing procedures",
          "Procurement and contracting requirements — bidding, the agreement, and the conditions of the contract",
          "HVAC diffuser layouts",
          "Punch list tracking",
        ],
        answer: 1,
      },
      {
        prompt: "The best summary of drawings vs. specs vs. Division 00/01 is:",
        options: [
          "They all say exactly the same thing",
          "Drawings show spatial intent, the technical specs define quality, and Div 00/01 set the legal/administrative rules",
          "Only the drawings matter",
          "Division 01 governs paint colors",
        ],
        answer: 1,
      },
    ],
  },
  "fo-meetings": {
    questions: [
      {
        prompt: "Who typically captures and distributes OAC meeting minutes, and why does the wording matter?",
        options: [
          "The owner; because they pay the bills",
          "The GC; undisputed minutes become an official project record that can establish timelines, approvals, and directives in a dispute",
          "The architect; for aesthetic reasons",
          "Nobody; minutes are optional",
        ],
        answer: 1,
      },
      {
        prompt: "The primary purpose of the weekly foreman / coordination meeting is to:",
        options: [
          "Review the owner's financing",
          "De-conflict workspace and shared equipment and firm up the 3-week look-ahead",
          "Approve change orders",
          "Sign the prime contract",
        ],
        answer: 1,
      },
      {
        prompt: "A precon (pre-construction) meeting with a trade is held:",
        options: [
          "After they finish their scope",
          "Before that subcontractor mobilizes on site",
          "Only if there's a dispute",
          "At the warranty walk",
        ],
        answer: 1,
      },
    ],
  },
  "fo-bim": {
    questions: [
      {
        prompt: "What is the difference between a hard clash and a soft clash?",
        options: [
          "A hard clash is expensive; a soft clash is cheap",
          "A hard clash is two objects in the same physical space; a soft clash violates a required clearance or access buffer without touching",
          "A hard clash is structural; a soft clash is only architectural",
          "There is no difference",
        ],
        answer: 1,
      },
      {
        prompt: "The main payoff of BIM clash coordination is:",
        options: [
          "Prettier renderings for marketing",
          "Resolving spatial conflicts digitally to eliminate costly field demolition and rework",
          "Replacing the need for shop drawings",
          "Avoiding the submittal process",
        ],
        answer: 1,
      },
      {
        prompt: "Which of these is a soft clash?",
        options: [
          "A waste pipe routed straight through a steel beam",
          "A pipe run that blocks the required access door of an electrical panel without touching it",
          "Two ducts welded together",
          "A column poured in the wrong place",
        ],
        answer: 1,
      },
    ],
  },
  "fo-site-logistics": {
    questions: [
      {
        prompt: "A lifting sling arrives with its capacity rating tag completely worn off and unreadable. You should:",
        options: [
          "Allow the lift if the sub says it's new",
          "Remove it from service immediately — a rating is never guessed",
          "Estimate the capacity and proceed carefully",
          "Use it only for light loads",
        ],
        answer: 1,
      },
      {
        prompt: "A site logistics plan defines all of the following EXCEPT:",
        options: [
          "Perimeter fencing, gates, and crane swing radius",
          "Material laydown, concrete washout, and dumpster locations",
          "The architect's interior finish selections",
          "Trailer positioning and site access routing",
        ],
        answer: 2,
      },
      {
        prompt: "Temporary utilities on a jobsite include:",
        options: [
          "Only the permanent switchgear",
          "Temp power, water, and heat/dehumidification that sustain the site before permanent tie-ins",
          "The owner's furniture",
          "Landscape irrigation only",
        ],
        answer: 1,
      },
    ],
  },
  "fo-field-layout": {
    questions: [
      {
        prompt:
          "Checking excavation depth with a laser, your target grade rod reading is 5.40 ft but the actual reading is 5.85 ft. What happened?",
        options: [
          "They dug too shallow by 0.45 ft",
          "They dug too deep by about 0.45 ft — a higher rod reading means a lower elevation",
          "The grade is exactly right",
          "The laser is broken",
        ],
        answer: 1,
      },
      {
        prompt: "The excavator hits unmarked orange spray paint directly in the dig path. Orange means, and you must:",
        options: [
          "Water — keep digging carefully",
          "Communications (fiber/phone/cable) — stop mechanical digging and hand-dig to expose the line",
          "Gas — evacuate the county",
          "Survey control — ignore it",
        ],
        answer: 1,
      },
      {
        prompt: "A compaction test returns 91% Proctor density but the spec requires 95%. The corrective action is:",
        options: [
          "Pour the concrete anyway; it's close enough",
          "Scarify the soil, adjust its moisture, re-compact, and re-test",
          "Lower the specification to 90%",
          "Add more rebar to compensate",
        ],
        answer: 1,
      },
    ],
  },
  "fo-glossary": {
    questions: [
      {
        prompt: "\"As-builts\" are:",
        options: [
          "The original bid drawings",
          "The final drawings redlined to show how systems were actually installed, deviations included",
          "The architect's first sketches",
          "A type of lien waiver",
        ],
        answer: 1,
      },
      {
        prompt: "A \"cold joint\" in concrete is:",
        options: [
          "A joint installed in winter",
          "A weak seam where fresh concrete is poured against an older batch that has already begun to harden",
          "A control joint saw-cut into a slab",
          "An expansion joint at a wall",
        ],
        answer: 1,
      },
      {
        prompt: "\"VIF\" (Verify in Field) on a drawing tells the contractor to:",
        options: [
          "Void the invoice format",
          "Physically measure the real-world dimension before ordering or fabricating parts",
          "Verify insurance forms",
          "Value-engineer the field work",
        ],
        answer: 1,
      },
    ],
  },

  // ═══════════════════ Integrated Project Management ═══════════════════
  "pm-integration": {
    questions: [
      {
        prompt: "Per the integrated approach, the root cause of most construction waste is:",
        options: [
          "The physical difficulty of building",
          "Fragmentation — the team, supply chain, and client working in siloed contracts with unshared goals",
          "A shortage of skilled labor",
          "Poor weather and site conditions",
        ],
        answer: 1,
      },
      {
        prompt: "The project manager's central function in the integrated approach is to:",
        options: [
          "Personally inspect every piece of work",
          "Minimize the number of subcontractors",
          "Integrate diverse interests and unify objectives toward a common goal",
          "Transfer as much risk as possible down the supply chain",
        ],
        answer: 2,
      },
      {
        prompt: "Which is a tool the integrated approach relies on?",
        options: [
          "Adversarial single-stage tendering",
          "Master–servant instruction flow",
          "Integrated Project Delivery (IPD) with shared risk/reward",
          "Maximum design/construction separation",
        ],
        answer: 2,
      },
    ],
  },
  "pm-success": {
    questions: [
      {
        prompt: "In the time–cost–quality triangle, trying to give all three priorities equal weight:",
        options: [
          "Is the easiest project to manage",
          "Makes the project much harder to manage because there's no basis for trade-off decisions",
          "Is required by PRINCE2",
          "Automatically reduces risk",
        ],
        answer: 1,
      },
      {
        prompt: "PRINCE2 expands the triangle to six variables. They are time, cost, quality, scope, and:",
        options: [
          "Weather and labor",
          "Risk and benefits",
          "Design and procurement",
          "Safety and ethics",
        ],
        answer: 1,
      },
      {
        prompt: "A 'critical success factor' (per Slevin & Pinto) is best described as:",
        options: [
          "A measure of whether the finished project was on time and budget",
          "A condition that must be in place during the project for it to succeed, such as a clear mission or top-management support",
          "The contractor's profit margin",
          "A type of insurance requirement",
        ],
        answer: 1,
      },
    ],
  },
  "pm-ethics": {
    questions: [
      {
        prompt: "In terms of ethics, the project manager is uniquely positioned:",
        options: [
          "As the client's advocate only",
          "In the middle — accountable to employer, client, the wider community, and the profession at once",
          "Outside the contract, with no accountability",
          "As the contractor's representative only",
        ],
        answer: 1,
      },
      {
        prompt: "The PMI grounds ethical conduct in four drivers. They are:",
        options: [
          "Speed, cost, quality, and scope",
          "Responsibility, respect, fairness, and honesty",
          "Power, interest, influence, and control",
          "Design, build, operate, and transfer",
        ],
        answer: 1,
      },
      {
        prompt: "Which is an everyday ethical trap the lesson warns about?",
        options: [
          "Paying subcontractors on time",
          "Documenting decisions in an audit trail",
          "Quality short cuts that become invisible once the work is covered",
          "Giving the client an honest schedule",
        ],
        answer: 2,
      },
    ],
  },
  "pm-business-case": {
    questions: [
      {
        prompt: "The cheapest place to change a project is:",
        options: [
          "On site during construction",
          "At the front end, in the brief and business case",
          "During closeout",
          "After handover",
        ],
        answer: 1,
      },
      {
        prompt: "The purpose of a Gateway / stage-gate review is to:",
        options: [
          "Speed the project up by skipping reviews",
          "Decide at each stage boundary whether the project should proceed, be reworked, or be stopped",
          "Lock the design so it can never change",
          "Transfer risk to the contractor",
        ],
        answer: 1,
      },
      {
        prompt: "A proper business case appraises the recommended option against:",
        options: [
          "Only the most expensive alternative",
          "Real alternatives including the 'do nothing' and 'do minimum' baselines",
          "The contractor's preferred option only",
          "Nothing — the recommended option stands alone",
        ],
        answer: 1,
      },
    ],
  },
  "pm-stakeholders": {
    questions: [
      {
        prompt: "A stakeholder is:",
        options: [
          "Only the party paying for the project",
          "Any individual or group who can affect, or is affected by, the project",
          "Only parties named in the contract",
          "Only the design and construction team",
        ],
        answer: 1,
      },
      {
        prompt: "On the power–interest matrix, a stakeholder with HIGH power and HIGH interest should be:",
        options: [
          "Monitored with minimal effort",
          "Kept informed only",
          "Managed closely",
          "Ignored until they complain",
        ],
        answer: 2,
      },
      {
        prompt: "Why should the stakeholder map be revisited at each project stage?",
        options: [
          "It never changes once drawn",
          "A stakeholder's power and interest shift over the life cycle (e.g. a neighbor becomes high-interest when piling starts)",
          "Regulations require a new map monthly",
          "To increase the number of stakeholders",
        ],
        answer: 1,
      },
    ],
  },
  "pm-procurement-strategy": {
    questions: [
      {
        prompt: "The procurement route decides all of the following EXCEPT:",
        options: [
          "Who designs and who builds, and in what sequence",
          "How much cost certainty and design control the client gets",
          "The exact color of the building's finishes",
          "How integrated or fragmented the team will be",
        ],
        answer: 2,
      },
      {
        prompt: "Design and build (D&B) procurement is characterized by:",
        options: [
          "Maximum client design control and a separate designer",
          "Single-point responsibility and better cost certainty, at the cost of some client design control",
          "The client managing every trade package directly",
          "No contractor involvement until the design is 100% complete",
        ],
        answer: 1,
      },
      {
        prompt: "A two-stage tender is used to:",
        options: [
          "Avoid ever giving the contractor a price",
          "Bring the contractor in early for buildability input while still preserving some competition",
          "Eliminate the design team",
          "Guarantee the lowest possible lump-sum price",
        ],
        answer: 1,
      },
    ],
  },
  "pm-leadership": {
    questions: [
      {
        prompt: "Situational leadership (Hersey & Blanchard) holds that the right style depends on:",
        options: [
          "The leader's fixed personality only",
          "The follower's readiness/competence and the nature of the task",
          "The size of the contract",
          "The weather",
        ],
        answer: 1,
      },
      {
        prompt: "The lesson notes leadership style often shifts across the life cycle — typically:",
        options: [
          "Autocratic in design, participative on site",
          "Participative in design, more directive during construction when tasks are tightly structured",
          "Delegative throughout, regardless of stage",
          "It should never change",
        ],
        answer: 1,
      },
      {
        prompt: "Fiedler's contingency theory adds that leader effectiveness depends on:",
        options: [
          "Only the leader's charisma",
          "The interaction between the leader's style and how much control the situation gives them",
          "The number of subcontractors",
          "The project's total budget",
        ],
        answer: 1,
      },
    ],
  },
  "pm-risk-value": {
    questions: [
      {
        prompt: "The four risk response strategies for a threat are avoid, transfer, accept, and:",
        options: [
          "Ignore",
          "Mitigate / reduce",
          "Escalate to the client",
          "Insure everything",
        ],
        answer: 1,
      },
      {
        prompt: "The core principle of risk allocation is that a risk should sit with:",
        options: [
          "Whoever is lowest in the supply chain",
          "The party best able to control it",
          "The client, always",
          "Whoever has the most insurance",
        ],
        answer: 1,
      },
      {
        prompt: "Value management differs from simple cost-cutting because it:",
        options: [
          "Always removes function to save money",
          "Removes cost without removing the function the client needs (or adds function for the same cost)",
          "Only happens after the project is over",
          "Is the same thing as cost-cutting",
        ],
        answer: 1,
      },
    ],
  },
  "pm-quality": {
    questions: [
      {
        prompt: "Quality assurance (QA) vs. quality control (QC): QA is primarily:",
        options: [
          "Reactive inspection that catches defects after the fact",
          "Preventive — the system and processes that stop defects being created",
          "Only the client's responsibility",
          "The same thing as QC",
        ],
        answer: 1,
      },
      {
        prompt: "Total Quality Management (TQM) treats quality as:",
        options: [
          "The job of a single QC inspector",
          "A whole-organization philosophy of continuous improvement where quality is everyone's responsibility",
          "An activity only done at closeout",
          "An optional extra",
        ],
        answer: 1,
      },
      {
        prompt: "Why does the book pair quality with 'customer care'?",
        options: [
          "They are unrelated topics",
          "The client's satisfaction depends on their experience — communication and how defects are handled — as much as the technical quality",
          "Customer care replaces the need for QC",
          "Customer care is only about marketing",
        ],
        answer: 1,
      },
    ],
  },
  "pm-digital": {
    questions: [
      {
        prompt: "BIM is most accurately described as:",
        options: [
          "A 3D drawing style",
          "An object-oriented, multi-dimensional database carrying geometry plus time, cost, quantities, and component properties",
          "A type of project scheduling software only",
          "A contract form",
        ],
        answer: 1,
      },
      {
        prompt: "The Common Data Environment (CDE) exists to:",
        options: [
          "Give each discipline its own private model",
          "Provide a single shared source of information with a controlled status workflow so everyone works from the same current truth",
          "Replace the need for a project manager",
          "Store only the final as-builts",
        ],
        answer: 1,
      },
      {
        prompt: "Clash detection delivers value by finding conflicts:",
        options: [
          "In the field, after installation",
          "In the model, where the fix is moving a line — before an RFI, delay, and change order in the field",
          "Only during closeout",
          "Only in 2D drawings",
        ],
        answer: 1,
      },
    ],
  },
  "pm-sustainability": {
    questions: [
      {
        prompt: "The central discipline of sustainable delivery is:",
        options: [
          "Choosing the cheapest first cost",
          "Whole-life cost — capital cost plus decades of energy, water, and maintenance",
          "Ignoring operating costs",
          "Maximizing embodied carbon",
        ],
        answer: 1,
      },
      {
        prompt: "BREEAM and LEED are:",
        options: [
          "Contract forms",
          "Building sustainability rating systems that score performance across categories like energy, water, and materials",
          "Types of concrete mix",
          "Insurance products",
        ],
        answer: 1,
      },
      {
        prompt: "On site, the contractor's biggest sustainability failure mode is:",
        options: [
          "Recycling construction waste",
          "Value-engineering the specified sustainable materials and systems out under cost pressure",
          "Protecting the specified materials",
          "Using low-impact site practices",
        ],
        answer: 1,
      },
    ],
  },
  "pm-closeout": {
    questions: [
      {
        prompt: "PRINCE2 emphasizes that closing a project means handing over to the user in a(n):",
        options: [
          "Rushed way to free up the crew",
          "Ordered way — completing work, resolving the punch list, transferring documentation, settling accounts",
          "Way that skips documentation",
          "Way that avoids the client",
        ],
        answer: 1,
      },
      {
        prompt: "Practical / substantial completion is the milestone that:",
        options: [
          "Means every last item is finished",
          "Lets the client occupy the building, starts warranty periods, and releases retainage even if minor items remain",
          "Happens before construction starts",
          "Voids the contract",
        ],
        answer: 1,
      },
      {
        prompt: "The 'systems improvement' half of closeout — lessons learned — matters because:",
        options: [
          "It is legally required on every project",
          "Fragmentation otherwise loses the knowledge, so the next project re-learns the same expensive mistakes",
          "It replaces the punch list",
          "It has no real value",
        ],
        answer: 1,
      },
    ],
  },
  "pm-cases": {
    questions: [
      {
        prompt:
          "Your job's declared priorities are time and quality, budget secondary — and you've staffed the team accordingly. Three weeks in, the environmental regulator signals it won't approve the design on your timeline. Reading the King Shaka case, the right conclusion is:",
        options: [
          "A clear triangle priority means the schedule is now protected from outside interference",
          "Declaring a priority organizes your team but doesn't exempt you from a powerful external stakeholder — engage the regulator as a high-power stakeholder immediately",
          "Budget being secondary means you can buy your way past the regulator",
          "Environmental approval isn't the PM's problem once the team is staffed",
        ],
        answer: 1,
      },
      {
        prompt:
          "A competitor keeps winning bids you suspect involve cover pricing, and a colleague suggests you 'play the same game to stay competitive.' Applying the ethics case (CCS vs. the OFT investigation):",
        options: [
          "Match them — competitiveness justifies it",
          "Decline: ethical conduct is reputation management with a long payback, and cover pricing is exactly what regulators investigate and clients punish",
          "Report the colleague to the client immediately without any internal step",
          "Ethics only matters on public work, so it depends on the owner",
        ],
        answer: 1,
      },
      {
        prompt:
          "Post-approval, a signature venue you're building will clearly under-earn in operation, and the owner asks how to protect the project's public value. The London 2012 case suggests:",
        options: [
          "The business case is fixed at approval, so nothing can change",
          "Actively manage the business case: find a use (e.g. a secondary tenant) that preserves the intended legacy/benefit even if it caps revenue",
          "Cancel the project since it won't maximize revenue",
          "Revenue always outranks legacy, so lease to the highest bidder regardless of use",
        ],
        answer: 1,
      },
      {
        prompt:
          "You're advising a public client on a fast-track infrastructure job where cooperation will be essential and clashes are likely. Drawing on the Hong Kong NEC3 case, the highest-leverage early move is:",
        options: [
          "Pick the lowest lump-sum bid and hold the contractor to it",
          "Choose a collaborative route (open-book, early warnings) and invest up front in training the team to actually use its mechanisms",
          "Push all utility-clash risk onto the contractor in the contract",
          "Avoid any risk-reduction meetings to save time",
        ],
        answer: 1,
      },
      {
        prompt:
          "On a large program, subs are padding their prices heavily for risks they can't really control, and the estimates are ballooning. The Heathrow T5 approach would be to:",
        options: [
          "Push even more risk down the supply chain to force lower prices",
          "Work open-book and have the client carry proven residual/excess risk across all tiers, managing risk at its cause so it can't be padded or passed down",
          "Accept the padded prices as the cost of doing business",
          "Remove all contingency so no one can price for risk",
        ],
        answer: 1,
      },
    ],
  },
};

export function getLessonQuiz(lessonId: string): LessonQuiz | undefined {
  return LESSON_QUIZZES[lessonId];
}

/** Answer-stripped quiz safe to send to the browser (null if no quiz). */
export function getPublicQuiz(lessonId: string): PublicQuiz | undefined {
  const quiz = LESSON_QUIZZES[lessonId];
  if (!quiz) return undefined;
  return {
    questions: quiz.questions.map((q) => ({ prompt: q.prompt, options: q.options })),
  };
}

/** True when a lesson has a quiz defined. */
export function hasQuiz(lessonId: string): boolean {
  return Boolean(LESSON_QUIZZES[lessonId]);
}

export type QuizGrade = {
  score: number;
  total: number;
  /** Per-question correctness, in question order. */
  correct: boolean[];
  /** The correct option index per question (revealed after grading). */
  correctAnswers: number[];
};

/**
 * Grade a submitted answer array against the stored answers. `answers[i]` is
 * the option index the user picked for question i (or -1/undefined if
 * unanswered). Returns null if the lesson has no quiz.
 */
export function gradeQuiz(lessonId: string, answers: number[]): QuizGrade | null {
  const quiz = LESSON_QUIZZES[lessonId];
  if (!quiz) return null;
  const correctAnswers = quiz.questions.map((q) => q.answer);
  const correct = quiz.questions.map((q, i) => answers[i] === q.answer);
  const score = correct.filter(Boolean).length;
  return { score, total: quiz.questions.length, correct, correctAnswers };
}
