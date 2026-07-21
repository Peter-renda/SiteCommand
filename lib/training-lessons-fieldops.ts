/**
 * "Preconstruction & Field Ops" track — the hands-on execution skills that sit
 * between the office workflows and the means-and-methods tracks: reading the
 * geotech report, doing your own takeoffs, constructability/VE reviews, the
 * Division 00/01 rulebook, running the recurring meetings, BIM clash
 * coordination, site logistics/mobilization, and field layout/survey — plus a
 * master glossary for quick reference. Built from the Construction Management &
 * Field Execution manual; each lesson fills a gap the other tracks don't cover
 * head-on (the workflow/concept/technical/mep tracks already cover submittals,
 * RFIs, scheduling, concrete, envelope, MEP, finishes, and closeout).
 *
 * Client-safe; imports only types from training-lessons (no runtime cycle).
 */

import type { Lesson, LessonLink } from "./training-lessons";

const PRACTICE_LINK: LessonLink = {
  label: "Practice this in your training sandbox",
  href: "/training/practice",
};

export const FIELDOPS_LESSONS: Lesson[] = [
  // ─────────────────────── Preconstruction & Planning ───────────────────────
  {
    id: "fo-geotech",
    track: "fieldops",
    category: "Preconstruction & Planning",
    title: "Reading Geotechnical Reports",
    summary:
      "What the dirt report tells you about bearing capacity, the water table, and soil type — and the six- and seven-figure decisions that ride on each one.",
    minutes: 5,
    keyTerms: [
      { term: "Bearing capacity", definition: "The load the soil can safely support (in psf). It decides whether cheap shallow spread footings work or expensive deep foundations (piles, caissons) are required." },
      { term: "Water table", definition: "The depth below grade where the soil is saturated. Excavating below it forces dewatering, shoring, and watertight foundation detailing." },
      { term: "Boring log", definition: "The vertical record from a single test boring — soil layers, blow counts (SPT N-value), and groundwater depth — sampled at points across the site." },
    ],
    body: [
      {
        heading: "What the report is actually answering",
        paragraphs: [
          "A geotechnical report is the subsurface story of the site, assembled from test borings drilled before design. It answers the questions drawings can't: how strong is the soil, how deep is the water, is there rock, and are there problem soils (expansive clay, organics, uncontrolled fill) hiding under the pad. The structural engineer's foundation design and the excavation plan both flow directly from it, which is why a PM reads it before mass grading — not after the excavator finds a surprise.",
        ],
      },
      {
        heading: "The numbers that move money",
        bullets: [
          "Bearing capacity — low bearing means shallow spread footings won't work, and the design jumps to driven piles or drilled caissons, one of the biggest cost-and-schedule swings on the whole job.",
          "Water table depth — excavating below it adds dewatering (wellpoints), trench shoring/shielding, watertight foundation detailing, and often imported structural backfill to replace saturated native soil.",
          "Soil classification (OSHA Type A / B / C) — governs safe excavation: how you slope, bench, or shore a trench so it doesn't cave in on the crew.",
          "Problem soils — expansive clay, organics, or uncontrolled fill trigger mitigation: undercut and replace, lime-stabilization, or mass over-excavation, all of it added scope.",
        ],
      },
      {
        heading: "It's sampled, not X-rayed",
        paragraphs: [
          "Borings are points; everything between them is interpolation. Treat the report's silence on an area as 'unknown,' not 'clean.' When the field doesn't match the report — rock where none was logged, water that wasn't there, buried debris — that's a differing site condition. Stop, photograph, and notify while the hole is still open, because the geotech report and the contract's differing-site-conditions clause are what turn that surprise into a change order instead of a loss.",
        ],
      },
      {
        heading: "Why it belongs in preconstruction planning",
        paragraphs: [
          "Deep-foundation elements (piles, caissons) and heavy dewatering are long-lead, high-cost items you want identified during buyout and estimating, not discovered in the field. The report drives the foundation submittal, seeds early RFIs to the structural engineer, and tells procurement which specialty subs to line up first.",
        ],
      },
    ],
    relatedLessonIds: ["sc-site-analysis", "tech-foundations", "tech-sitework"],
    links: [PRACTICE_LINK],
  },
  {
    id: "fo-takeoffs",
    track: "fieldops",
    category: "Preconstruction & Planning",
    title: "Material Takeoffs & Quantity Verification",
    summary:
      "Turning 2D drawings into real quantities so you can check a subcontractor's bid instead of trusting it.",
    minutes: 5,
    keyTerms: [
      { term: "Quantity takeoff", definition: "Measuring and counting directly from the drawings to produce physical quantities — area, volume, linear feet, and counts of items." },
      { term: "On-Screen Takeoff / Bluebeam", definition: "Software that lets you trace digital drawings to compute quantities without a scale ruler and printed sheets." },
      { term: "Unit of measure", definition: "The basis a quantity and its unit price are expressed in — SF (area), CY (volume), LF (length), EA (count), TON (weight)." },
    ],
    body: [
      {
        heading: "Why the GC does its own takeoff",
        paragraphs: [
          "A subcontractor's lump-sum bid is a black box — you don't know what quantities they assumed. An independent takeoff by the GC is the baseline truth you level bids against: it flags a bid that's low because the sub missed scope (or is deliberately underbidding to catch it up in change orders), and it's what you use later to price change orders and sanity-check a Schedule of Values.",
        ],
      },
      {
        heading: "The common units you'll pull",
        bullets: [
          "Concrete — cubic yards (CY) of footings, walls, and slab.",
          "Drywall, paint, flooring, roofing — square feet (SF) of area.",
          "Rebar and structural steel — tons and linear feet.",
          "Doors, windows, fixtures, devices — each (EA) counts.",
          "Sitework — cubic yards of cut and fill from the grading plan.",
        ],
      },
      {
        heading: "The takeoff feeds everything downstream",
        paragraphs: [
          "The same quantities roll forward: into the estimate, into bid leveling at buyout, into the SOV line items, and into change-order pricing. A careful takeoff up front pays off every month for the rest of the job; a sloppy one means every invoice review and every change fight starts from a guess.",
        ],
      },
      {
        heading: "Common pitfalls",
        bullets: [
          "Forgetting waste and lap factors — you buy more rebar and drywall than the net measured quantity.",
          "Reading off the wrong scale or an un-scaled PDF, so every number is proportionally wrong.",
          "Double-counting where plans and details overlap, or missing scope that only appears in a detail, not the plan.",
          "Trusting a bid that's far below your quantity-based number as a 'bargain' instead of a red flag for missing scope.",
        ],
      },
    ],
    relatedLessonIds: ["pf-estimating", "wf-buyout", "cn-csi"],
    links: [PRACTICE_LINK],
  },
  {
    id: "fo-constructability-ve",
    track: "fieldops",
    category: "Preconstruction & Planning",
    title: "Constructability Reviews & Value Engineering",
    summary:
      "Two paper reviews that save money before the field ever swings a hammer — catching what can't be built, and finding cheaper ways to build what can.",
    minutes: 5,
    keyTerms: [
      { term: "Constructability review", definition: "A sweep of the construction documents to find design elements that are physically impossible, impractical to build, or impossible to sequence." },
      { term: "Value engineering (VE)", definition: "Proposing alternative materials or methods that reduce cost while preserving function, structural safety, and design intent — not just cheapening the job." },
      { term: "Interference / clash", definition: "Two systems designed to occupy the same space or clearance — the classic constructability (and BIM) red flag." },
    ],
    body: [
      {
        heading: "Constructability: can it actually be built?",
        paragraphs: [
          "A design can be beautiful on paper and impossible in the field. A constructability review redlines the documents looking for exactly that: not enough plenum height for the ductwork above a shallow structural ceiling, a roof-to-wall flashing detail that can't physically be lapped correctly, a piece of equipment with no viable path to its final location, or trades sequenced in an order that can't happen. Catch it as an RFI now; discover it during install and it's rework.",
        ],
      },
      {
        heading: "Value engineering: same function, lower cost",
        paragraphs: [
          "True VE optimizes the ratio of function to cost — it holds design intent, structural safety, and life-cycle performance constant while finding a cheaper way to get there. A textbook example is swapping a labor-intensive sheet-applied air barrier for a fluid-applied system that installs in far fewer field hours with equal performance. What VE is not: quietly downgrading materials until performance suffers. That's not value engineering, it's a future warranty claim.",
        ],
      },
      {
        heading: "Timing is the whole game",
        paragraphs: [
          "Both reviews are cheapest during preconstruction, when a change is an eraser mark. The cost of fixing the same issue climbs steeply as it moves from design, to shop drawings, to material on site, to installed work. This is why constructability and VE are preconstruction disciplines — the value is front-loaded, and it evaporates once the trade mobilizes.",
        ],
      },
      {
        heading: "Common pitfalls",
        bullets: [
          "VE proposals that trim first cost but blow up life-cycle cost or void a warranty.",
          "Running constructability only on the architectural set and missing the MEP-vs-structure clashes (that's what BIM coordination is for).",
          "Proposing a VE alternative so late that the re-submittal and re-design eat the savings.",
        ],
      },
    ],
    relatedLessonIds: ["cn-drawings", "tech-mep-coordination", "pf-estimating"],
    links: [PRACTICE_LINK],
  },
  {
    id: "fo-div00-01",
    track: "fieldops",
    category: "Preconstruction & Planning",
    title: "Division 00 & 01: The Project Rulebook",
    summary:
      "The front-end of the project manual — the legal and administrative rules that govern how you submit, bill, and claim, no matter what the technical specs say.",
    minutes: 5,
    keyTerms: [
      { term: "Project Manual", definition: "The bound book of specifications plus the front-end documents (bidding requirements, the agreement, the conditions of the contract, and Division 01)." },
      { term: "Division 00", definition: "Procurement & Contracting Requirements — invitation to bid, instructions to bidders, the agreement form, and the general/supplementary conditions of the contract." },
      { term: "Division 01", definition: "General Requirements — the project-wide administrative and procedural rules (submittals, payment, RFIs, scheduling, closeout) that bind every other division." },
    ],
    body: [
      {
        heading: "Drawings say 'what,' specs say 'how good,' Div 00/01 say 'by what rules'",
        paragraphs: [
          "Architectural drawings convey spatial intent. The technical spec sections (Divisions 02-49) define the quality of each material and assembly. But the front end of the Project Manual — Division 00 and Division 01 — is the rulebook that governs how the whole job is administered legally: how you get paid, how you ask questions, how you document a delay. A PM who only reads the technical sections is flying half-blind.",
        ],
      },
      {
        heading: "Division 00 vs. Division 01",
        bullets: [
          "Division 00 — the procurement and contracting layer: how the job was bid and awarded, the agreement form, and the general and supplementary conditions of the contract.",
          "Division 01 — the general requirements: project-wide procedures that override or supplement how every technical division is executed (a single rule for submittal format applies to concrete, steel, and finishes alike).",
        ],
      },
      {
        heading: "Why Division 01 controls your daily life",
        paragraphs: [
          "Division 01 dictates the exact administrative mechanics the whole team must follow: submittal format and routing, the pay-application procedure and SOV format, the RFI process, schedule update requirements, substitution rules, and closeout deliverables. Critically, it's where the notice deadlines live — how many days you have to give written notice of a delay or a changed condition before you lose the right to a time extension or extra cost. When a dispute is about process rather than product, the answer is almost always in Division 01.",
        ],
      },
      {
        heading: "Common pitfalls",
        bullets: [
          "Reading only the technical sections and missing a Division 01 rule (like a strict format for pay apps) that gets your first invoice bounced.",
          "Blowing a claim's written-notice deadline because nobody read the notice provisions in the front end.",
          "Assuming the drawings win a conflict — the order of precedence between drawings, specs, and the agreement is itself spelled out in Division 00.",
        ],
      },
    ],
    relatedLessonIds: ["cn-specs", "cn-csi", "com-documents"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Coordination & Meetings ───────────────────────
  {
    id: "fo-meetings",
    track: "fieldops",
    category: "Coordination & Meetings",
    title: "Running Construction Meetings: Precon, OAC & Coordination",
    summary:
      "The three recurring meetings that keep dozens of companies aligned — what each one is for, who runs it, and why the minutes are a legal record.",
    minutes: 5,
    keyTerms: [
      { term: "Precon meeting", definition: "A trade-specific kickoff held with a subcontractor before they mobilize: safety, quality checklists, laydown zones, delivery rules, and open submittal/RFI items." },
      { term: "OAC meeting", definition: "Owner-Architect-Contractor — the formal, usually bi-weekly, status meeting the GC chairs to align the whole team on schedule, logs, changes, and finances." },
      { term: "Coordination / foreman meeting", definition: "A weekly, field-level meeting the superintendent runs with the trade foremen to de-conflict space, shared equipment, and the 3-week look-ahead." },
    ],
    body: [
      {
        heading: "Meetings are the accountability mechanism, not ceremony",
        paragraphs: [
          "A project is built by dozens of separate companies, and the only thing keeping them aligned is a structured communication cadence. Each recurring meeting has a distinct altitude and audience — mixing them up (talking crane picks at the OAC, or owner financials at the foreman meeting) is how meetings become the thing everyone dreads instead of the thing that moves the job.",
        ],
      },
      {
        heading: "The three meetings, by altitude",
        bullets: [
          "Precon — led by the superintendent and PM with one incoming trade, before they set foot on site. Establishes operational boundaries: safety plan, quality expectations, designated laydown, delivery gates, cleanup, and which submittals/RFIs must close first.",
          "OAC — the GC chairs; owner and architect attend. Bi-weekly, high-level: safety metrics, master schedule health, long-lead procurement status, open RFI/submittal logs, pending change orders, and financial draw status.",
          "Coordination / foreman — the superintendent runs it weekly with the active trade foremen. Granular and tactical: de-conflict workspace, schedule shared resources (crane picks, freight elevator), housekeeping, and lock the 3-week look-ahead.",
        ],
      },
      {
        heading: "Minutes are a project record",
        paragraphs: [
          "The GC typically captures and distributes the minutes, and that makes the wording matter enormously. Undisputed minutes become an official record: they establish timelines, document owner approvals, and confirm directives that later show up in a delay claim or a change dispute. Distribute promptly, invite corrections with a deadline, and write directives and dates precisely — vague minutes protect no one.",
        ],
      },
      {
        heading: "The look-ahead lives in the coordination meeting",
        paragraphs: [
          "This is where sequencing conflicts get solved before they become field problems — the electrical foreman can't run conduit in Zone B until framing finishes the backing, framing is waiting on a blocking layout, and the super walks both to a firm commitment date that gets tracked in the 3-week look-ahead. That real-time de-confliction is the meeting's whole reason to exist.",
        ],
      },
    ],
    relatedLessonIds: ["wf-daily-logs", "wf-rfis", "pf-communication"],
    links: [PRACTICE_LINK],
  },
  {
    id: "fo-bim",
    track: "fieldops",
    category: "Coordination & Meetings",
    title: "BIM & Clash Coordination",
    summary:
      "Resolving spatial conflicts in a 3D model before the field builds them wrong — hard clashes, soft clashes, and the cheapest rework you'll ever do.",
    minutes: 5,
    keyTerms: [
      { term: "BIM", definition: "Building Information Modeling — coordinated 3D models of the architectural, structural, and MEP systems used to detect and resolve conflicts before installation." },
      { term: "Hard clash", definition: "Two objects occupying the same physical space — an 8-inch waste pipe routed straight through a structural steel beam." },
      { term: "Soft clash", definition: "A clearance or access violation even though nothing physically overlaps — a pipe blocking the code-required working space in front of an electrical panel." },
    ],
    body: [
      {
        heading: "Coordinate in pixels, not in steel",
        paragraphs: [
          "Once the ductwork, pipe, conduit, and structure are all installed, moving any of it means demolition. BIM clash coordination does that fight in the model instead: the coordination team aggregates every trade's 3D model in a platform like Navisworks, runs automated clash detection, and repositions components digitally until they fit. The output is a set of coordinated, sign-off-ready shop models the trades build from.",
        ],
      },
      {
        heading: "Hard clash vs. soft clash",
        paragraphs: [
          "A hard clash is a physical overlap — two objects in the same space. A soft clash is subtler and easier to miss: an object that violates a required clearance or maintenance-access buffer without actually touching anything, like a pipe run that leaves no room to open an electrical panel door or service a valve. Soft clashes are the ones that pass a casual eyeball review and then fail an inspection or an angry facilities manager after occupancy.",
        ],
      },
      {
        heading: "It feeds the ceiling and the schedule",
        paragraphs: [
          "The reflected ceiling plan is where lights, diffusers, sprinklers, and speakers all compete for the same grid — BIM coordination is how that competition gets resolved before rough-in. And a completed, signed-off coordination model is itself a schedule hold point: MEP rough-in in a zone shouldn't start until that zone's coordination is closed, or you're installing conflicts you'll pay to rip out.",
        ],
      },
      {
        heading: "Clash detection is just the start — BIM is a database, not a drawing",
        paragraphs: [
          "The clash coordination above is BIM's most visible payoff, but it's worth understanding what BIM actually is. Fewings & Henjewele define it precisely: an object-oriented database with multiple dimensions that carries the 3D geometry along with time, cost, quantities, geographic information, and component properties. The geometry is one view; the value is that every object knows what it is, so a query — how many fire dampers, what's this wall's U-value, when does this element install — has an answer.",
          "That's why the extra 'dimensions' matter: 4D links the model to the schedule so you can simulate and test the build sequence (not just spatial clashes); 5D links it to cost and quantities so a design change updates the take-off automatically. And BIM only delivers integration if everyone draws from one place — the Common Data Environment (CDE), a shared repository with a controlled status workflow (work-in-progress → shared → published → archived) so people can tell current, coordinated information from someone's draft. Without a disciplined CDE, BIM fragments back into competing private models.",
        ],
      },
      {
        heading: "Common pitfalls",
        bullets: [
          "Modeling that lags the field, so crews install ahead of coordination and the model becomes a record of rework instead of a plan.",
          "Treating 'coordination signed off' as done while the field builds from old 2D sheets anyway.",
          "Omitting a trade (or the structure) from the aggregated model, so the clashes it would have caused surface in the field.",
          "No disciplined CDE — teams work from private copies, and the 'single source of truth' quietly becomes several conflicting ones.",
        ],
      },
    ],
    relatedLessonIds: ["cn-rcp", "cn-mep", "tech-mep-coordination", "mep-coordination-scheduling", "pm-digital"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Site Logistics & Layout ───────────────────────
  {
    id: "fo-site-logistics",
    track: "fieldops",
    category: "Site Logistics & Layout",
    title: "Site Logistics, Mobilization & Temporary Facilities",
    summary:
      "The plan that turns a cramped lot into a working jobsite — fencing, gates, crane radius, laydown, washout, rigging oversight, and temporary utilities.",
    minutes: 6,
    keyTerms: [
      { term: "Site logistics plan", definition: "A spatial map of construction operations: perimeter fence, access gates, crane placement and swing radius, material staging, concrete washout, dumpsters, and trailers." },
      { term: "Laydown / staging area", definition: "Designated space where delivered material sits before it's installed — badly placed, it blocks access and becomes a bottleneck." },
      { term: "Temporary utilities", definition: "The temp power, water, heat/dehumidification, and drainage that sustain the site before permanent systems are energized and tied in." },
    ],
    body: [
      {
        heading: "The footprint is a design problem",
        paragraphs: [
          "A site logistics plan is a living map of how the site operates: secure perimeter fencing, controlled personnel and vehicle gates, crane placement zones with clear swing radiuses, dedicated laydown and staging, a concrete washout pit, dumpster locations, and trailer positioning. On a cramped urban lot with no room to stage, this plan is one of the highest-leverage documents on the job — get it wrong and every delivery, pick, and trade fights the same square footage all year.",
        ],
      },
      {
        heading: "Mobilization: standing the site up",
        paragraphs: [
          "Mobilization is the sequence that makes a bare lot workable before real production starts: install the perimeter fence and gates, set the field trailer, bring in temporary power and water, establish access and signage, and stand up the washout and waste plan. Skipping steps here shows up later as a site that can't support the work it's trying to do.",
        ],
      },
      {
        heading: "Cranes and rigging oversight",
        paragraphs: [
          "Heavy hoisting is where a logistics mistake becomes a fatality. Plan the crane's swing radius against overhead lines, adjacent property, and the public. In the field, verify the operator's certification, confirm all rigging (slings, shackles, spreader bars) carries a legible load-rating tag and passed its daily inspection, and require a dedicated spotter using standard hand signals or a dedicated radio channel for blind lifts. A sling with a worn-off, unreadable capacity tag comes out of service immediately — you never guess a rating.",
        ],
      },
      {
        heading: "Temporary utilities",
        bullets: [
          "Temporary power — sized for field lighting, hand tools, and the crane, from temp panels until permanent service is energized.",
          "Temporary water — a construction water manifold for dust control and concrete work.",
          "Temporary climate — heaters and dehumidifiers to keep finishes and concrete curing within spec in cold or wet weather.",
          "Temporary drainage — keeping the working site from flooding while permanent stormwater is still being built.",
        ],
      },
      {
        heading: "Common pitfalls",
        bullets: [
          "No concrete washout (or an overflowing one) — a fast SWPPP violation and fine.",
          "Laydown areas that creep into access roads or crane zones and choke the site.",
          "Undersized temp power that trips under real load, stalling every trade at once.",
        ],
      },
    ],
    relatedLessonIds: ["wf-safety", "sc-esc", "wf-scheduling"],
    links: [PRACTICE_LINK],
  },
  {
    id: "fo-field-layout",
    track: "fieldops",
    category: "Site Logistics & Layout",
    title: "Field Layout & Survey: Benchmarks, Gridlines & 811",
    summary:
      "Translating paper into dirt — the datum every elevation ties to, gridlines squared with 3-4-5, excavation depth checks, the 811 color codes, and compaction testing.",
    minutes: 6,
    keyTerms: [
      { term: "Benchmark / datum", definition: "A permanent reference point of known elevation, set by a surveyor, that every grade, utility depth, and slab height on the job is measured from." },
      { term: "Gridline", definition: "The structural reference lines (columns and bearing walls) laid out in the field from surveyor control points, squared with the 3-4-5 rule." },
      { term: "811 / one-call", definition: "The 'call before you dig' locate service; existing utilities are marked on the ground in standard APWA color codes before any excavation." },
    ],
    body: [
      {
        heading: "Elevation: everything ties to the datum",
        paragraphs: [
          "A licensed surveyor sets a benchmark — a fixed point of known elevation — and field staff transfer that baseline across the site with an optical or digital level. Every grading cut, utility invert, and floor slab height references it. One counterintuitive habit to build early: on a grade rod, a higher reading means a lower physical elevation (the rod's foot is sitting deeper), so a rod reading above your target means the bottom is too low, not too high.",
        ],
      },
      {
        heading: "Geometry: gridlines and squaring",
        paragraphs: [
          "Field staff translate the surveyor's offset control points into crisp layout lines — string lines, chalk lines, or a total station — to position columns and bearing walls. Corners are verified square with the geometric 3-4-5 rule (a 3-4-5 triangle is a guaranteed right angle). This matters because a small layout error at the foundation amplifies as the building rises: a fraction of an inch out of square at grade becomes warped baseboards, crooked door frames, and cabinets that won't fit at the top.",
        ],
      },
      {
        heading: "Digging to the right depth",
        paragraphs: [
          "Excavation elevations are tracked continuously with a rotary laser and a graded rod. Both errors cost money: over-excavating destroys the native soil's compaction and forces you to import and place engineered structural fill, while under-excavating leaves the slab or footing too thin to meet the structural spec. The goal is to hit the exact subgrade the drawings call for.",
        ],
      },
      {
        heading: "811 color codes — call before you dig",
        bullets: [
          "Red — electric power lines, cables, conduit.",
          "Yellow — gas, oil, steam, and other flammable material.",
          "Blue — potable water.",
          "Green — sewer and drain lines.",
          "Orange — communication, alarm, fiber, cable TV.",
          "Purple — reclaimed water and irrigation.",
          "Pink — temporary survey markings; White — proposed excavation.",
        ],
        paragraphs: [
          "When mechanical excavation nears a mark, switch to careful hand-digging (potholing) to physically expose the line before proceeding — striking an unmarked or mismarked utility is one of the most dangerous and expensive field mistakes there is.",
        ],
      },
      {
        heading: "Compaction testing oversight",
        paragraphs: [
          "Structural fill under foundations and pavement must reach a specified density — typically 95% or more of the maximum dry density from a Proctor test. Field staff witness an independent technician run nuclear density testing and confirm moisture and passes meet spec before authorizing concrete. When a lift fails (say 91% against a 95% requirement), the fix is to scarify the soil, adjust its moisture, re-compact, and re-test — not to pour on top of it.",
        ],
      },
    ],
    relatedLessonIds: ["tech-sitework", "sc-grading", "sc-utilities"],
    links: [PRACTICE_LINK],
  },

  // ──────────────────────────────── Reference ────────────────────────────────
  {
    id: "fo-glossary",
    track: "fieldops",
    category: "Reference",
    title: "Master Construction Glossary",
    summary:
      "A quick-reference glossary of the field and contract terms every PM hears in the first week on a job.",
    minutes: 7,
    keyTerms: [
      { term: "As-Builts", definition: "The final drawing set redlined to show exactly how systems were actually installed, including every deviation from the original design." },
      { term: "Retainage", definition: "5-10% of each payment withheld until the end of the job to ensure the sub comes back and finishes punch." },
      { term: "Float", definition: "The buffer time a task has before its delay starts pushing back the project's final completion date." },
      { term: "Dry-In", definition: "The milestone when the roof and exterior walls are sealed, so weather-sensitive interior work can safely begin." },
    ],
    body: [
      {
        heading: "How to use this",
        paragraphs: [
          "These are the terms that fly around a jobsite and a contract with no explanation, as if everyone was born knowing them. Skim the list, and when one keeps coming up, follow the linked lessons below for the full treatment — retainage and lien waivers, float and the critical path, contract types, and closeout all have dedicated modules.",
        ],
      },
      {
        heading: "Field & structural terms",
        bullets: [
          "As-Builts — the final drawings redlined to show how systems were actually installed, deviations included.",
          "Blocking — wood or metal reinforcement inside a hollow wall giving a solid anchor point for heavy items (TVs, handrails, cabinets).",
          "Chasing Wall — an intentionally widened, double-stud wall built to hide large plumbing pipes or ductwork.",
          "Cold Joint — a weak seam where fresh concrete is poured against an older batch that has already started to harden.",
          "Dry-In — the milestone when roof and exterior walls are sealed, allowing interior finishes to begin.",
          "MEP Rough-In — the phase where mechanical, electrical, and plumbing lines are run through open framing before the walls close up.",
          "Mock-Up — a standalone physical sample of a building assembly (a brick wall section, a window) built on-site to test looks and waterproofing.",
          "Sleeves — hollow pipes cast into concrete walls or floors that act as tunnels for future pipes and wires to pass through.",
          "Slab-on-Grade (SOG) — a concrete floor poured directly on compacted dirt, with no basement or crawlspace beneath it.",
        ],
      },
      {
        heading: "Contract, cost & schedule terms",
        bullets: [
          "Backcharge — money deducted from a sub's payment because the GC had to clean up their mess or finish their abandoned work.",
          "Egress — the legally required, continuous, unblocked path of travel out of a building during an emergency.",
          "Float — the buffer time a task has before its delay pushes back the whole project's completion.",
          "Lien Waiver — a signed receipt confirming a sub was paid, waiving their right to lien the property for that amount.",
          "Retainage — typically 5-10% of each monthly payment withheld until the end to ensure the sub finishes punch.",
          "T&M (Time & Materials) — billing tracked daily by labor hours and material receipts rather than a fixed lump sum agreed in advance.",
          "VIF (Verify in Field) — a warning on drawings telling the contractor not to trust the paper dimension and to physically measure the real space before ordering parts.",
        ],
      },
    ],
    relatedLessonIds: ["cn-retainage", "wf-scheduling", "wf-punch-closeout", "cn-contracts"],
  },
];
