/**
 * Training → Lessons: phase-track fill-in modules.
 *
 * The lifecycle reorganization (see lib/training-lessons.ts) splits the older
 * "Building the Work" content across the seven build-order phase tracks. A few
 * phase categories the user's outline calls out weren't covered head-on by any
 * existing lesson — demolition & site clearing, deep foundations, slab-on-grade
 * specifics, elevated slabs, interior partition framing, the individual finish
 * trades, and the final-inspection / Certificate of Occupancy gauntlet. These
 * modules fill those gaps. They import only types from the main module, so
 * there is no runtime import cycle, and each declares its own track/category
 * like every other lesson.
 */

import type { Lesson } from "./training-lessons";

export const PHASE_LESSONS: Lesson[] = [
  // ───────────── Site Development · Erosion Control & Demolition ─────────────
  {
    id: "site-demolition",
    track: "sitedev",
    category: "Erosion Control & Demolition",
    title: "Demolition & Site Clearing",
    summary:
      "Clearing what's already there — hazmat abatement first, then structures, then grubbing — without inheriting someone else's contamination or a utility strike.",
    minutes: 5,
    keyTerms: [
      { term: "Abatement", definition: "Removal of regulated hazardous materials (asbestos, lead paint) by a licensed abatement contractor before any structural demolition can begin — a permitted, inspected scope of its own." },
      { term: "Grubbing", definition: "Removing roots, stumps, and buried organic debris after clearing, so the material left in place is suitable to build the pad on." },
      { term: "Utility disconnect / kill", definition: "The documented, permitted termination and capping of active services (gas, electric, water, sewer) to a structure before it's torn down." },
    ],
    body: [
      {
        heading: "Sequence protects you from what you can't see",
        paragraphs: [
          "Demolition looks like the least technical scope on the job — a machine and a dumpster — but it's where the most expensive surprises hide, because you're dealing with conditions nobody fully documented. The safe sequence is fixed: survey and locate utilities, disconnect and cap active services, abate regulated materials, then demolish structures, then clear and grub vegetation. Skipping straight to demolition is how a hydraulic breaker finds a live gas line or an excavator spreads asbestos across the site.",
        ],
      },
      {
        heading: "Hazmat comes before the wrecking ball",
        bullets: [
          "Any structure built before roughly the late 1980s is presumed to contain asbestos and lead paint until a pre-demolition survey says otherwise — regulations (EPA NESHAP, OSHA) require the survey and licensed abatement before demolition, not after.",
          "Abatement is its own permitted, inspected, air-monitored scope with its own contractor — build its duration into the schedule; it can't overlap structural demo.",
          "Underground storage tanks, contaminated soil, and buried debris are the differing-site-condition traps — if the Phase I/II ESA flagged them, plan for them; if demo uncovers them unexpectedly, stop and document (see the Environmental Site Assessment lesson).",
        ],
      },
      {
        heading: "The PM's demolition checklist",
        bullets: [
          "Locate before you dig — public 811 locate plus a private utility locate; an active line that was supposed to be dead is the classic demo incident.",
          "Erosion control goes in before clearing, not after — silt fence and inlet protection are compromised the moment you strip vegetation (see Erosion & Sediment Control).",
          "Protect what stays — trees inside the tree-protection fence, adjacent structures, and any existing utilities feeding neighbors.",
          "Track the debris — C&D recycling and manifested hazardous waste are documentation deliverables, and diversion rates may be a permit or LEED requirement.",
        ],
      },
    ],
    relatedLessonIds: ["sc-esc", "sc-environmental", "tech-sitework"],
  },

  // ───────────────── Substructure · Deep Foundations ─────────────────
  {
    id: "sub-deep",
    track: "substructure",
    category: "Deep Foundations",
    title: "Deep Foundations: Piles, Caissons & Ground Improvement",
    summary:
      "When the soil near the surface can't carry the building, load has to reach something that can — driven piles, augercast, drilled caissons, or improved ground.",
    minutes: 6,
    keyTerms: [
      { term: "End bearing vs. friction", definition: "The two ways a deep foundation carries load: end bearing rests the tip on rock/dense strata; a friction pile transfers load through skin friction along its length. Most piles do some of both." },
      { term: "Caisson (drilled shaft / drilled pier)", definition: "A large-diameter hole drilled to bearing, reinforced, and filled with concrete — poured in place rather than driven." },
      { term: "Pile driving criteria / refusal", definition: "The engineer's blow-count/set requirement that confirms a driven pile has reached capacity; hitting it is 'refusal.'" },
    ],
    body: [
      {
        heading: "Why you'd ever go deep",
        paragraphs: [
          "Shallow foundations (footings, mats) work when competent soil is close to the surface. When it isn't — soft clays, fill, high water table, or heavy column loads on marginal soil — the geotechnical report will call for deep foundations that reach load down to a stratum that can actually carry it. This is a design decision made from the geotech report (see Reading Geotechnical Reports), not a field call, and it's usually the single biggest below-grade cost and schedule variable on the job.",
        ],
      },
      {
        heading: "The families you'll see",
        bullets: [
          "Driven piles (steel H-pile, pipe, precast concrete): hammered to a driving criterion. Fast and verifiable by blow count, but loud, vibration-heavy, and rough on neighbors — pre-construction condition surveys of adjacent structures are standard.",
          "Augercast / CFA piles: a hollow auger drilled down, then grout pumped through the stem as it withdraws. Low vibration and quiet, but quality is hidden — automated monitoring of grout volume and pressure is how you verify a pile you can't see.",
          "Drilled caissons / shafts: large-diameter holes to bearing, often socketed into rock; used for the heaviest loads. Spoils, dewatering, and possible casing or slurry to hold the hole open are the field issues.",
          "Ground improvement (stone columns, deep soil mixing, rammed aggregate piers): stiffens the soil so shallow foundations become viable — sometimes cheaper than piling.",
        ],
      },
      {
        heading: "What the PM actually manages",
        bullets: [
          "Load testing and verification: static or dynamic (PDA) tests prove capacity; the special-inspector's pile-driving or shaft-installation logs are contract deliverables and the basis for acceptance.",
          "Pay quantity truth: deep foundations are often paid by installed length, and 'the pile went deeper than plan' is a change-order conversation you want the engineer and inspector documenting in real time.",
          "Spoils and dewatering: caissons and drilling generate soil and water that need somewhere to go, sometimes with disposal/permitting implications if the soil is contaminated.",
          "It gates everything: the whole structure sits on this scope, and it's on the critical path before a single column goes up — a slow or reworked pile program pushes the entire job.",
        ],
      },
    ],
    relatedLessonIds: ["fo-geotech", "tech-foundations", "sc-grading"],
  },

  // ─────────────── Substructure · Slab on Grade & Concrete ───────────────
  {
    id: "sub-sog",
    track: "substructure",
    category: "Slab on Grade & Concrete",
    title: "Slab on Grade: Vapor Barriers, Rebar & Under-Slab Rough-In",
    summary:
      "The ground-floor slab is poured over everything the trades buried first — get the sequence, the vapor barrier, and the joints wrong and you're chipping out a floor you already finished.",
    minutes: 5,
    keyTerms: [
      { term: "Vapor barrier / retarder", definition: "The sheet membrane (typically ≥10-mil, per ASTM E1745) under the slab that stops ground moisture from wicking up and ruining flooring adhesives later. Placed directly under the slab in most modern details." },
      { term: "Under-slab rough-in", definition: "The plumbing, electrical conduit, and sometimes mechanical that must be installed, inspected, and pressure-tested before the slab is poured over them." },
      { term: "Control / contraction joint", definition: "A tooled or sawn line that gives a slab a planned place to crack as it shrinks, instead of cracking randomly across the floor." },
    ],
    body: [
      {
        heading: "The slab is the last step of a buried sequence",
        paragraphs: [
          "A slab on grade looks like a concrete pour, but the pour is the easy part — the risk is everything that goes in first and gets covered forever. Sub-grade is compacted and proof-rolled, under-slab utilities are installed and inspected, a capillary break of clean stone goes down, the vapor barrier is rolled out and sealed, reinforcement is placed and chaired to the right height, and only then does concrete arrive. Every one of those is an inspection or a test, because the cost of fixing any of them jumps by an order of magnitude the moment the slab covers it.",
        ],
      },
      {
        heading: "Under-slab rough-in: coordinate or chip",
        bullets: [
          "Plumbing DWV and supply, electrical conduit stub-ups, and any under-slab mechanical are located off the same drawings — a floor drain or stub-up two feet off lands in the wrong room permanently.",
          "Everything under the slab gets an inspection and a pressure/leak test before cover — sanitary gets a ball or air test, water gets a hydro test. Cover nothing untested.",
          "Sleeves and blockouts for future penetrations are cheaper now than a core drill later; walk the slab against the MEP plans one last time before the barrier goes down.",
        ],
      },
      {
        heading: "Where slabs go wrong",
        bullets: [
          "Punctured vapor barrier: chairs, stakes, and foot traffic tear it; unrepaired punctures are the direct cause of flooring adhesive failures a year later — a five-figure problem with a duct-tape prevention.",
          "Joints and cracking: control joints on the engineer's spacing, sawn early (green) before random shrinkage cracking starts; miss the window and the slab picks its own cracks.",
          "Curing and moisture: slabs must cure wet/protected and then be moisture-tested (RH probes per ASTM F2170) before flooring — the concrete being 'hard' is not the same as 'dry enough for floor.'",
          "Flatness/levelness (FF/FL numbers) is a specified, measured deliverable where flooring or racking demands it — measured within hours of finishing, not argued after.",
        ],
      },
    ],
    relatedLessonIds: ["tech-concrete", "tech-foundations", "mep-plumbing"],
  },

  // ───────────────── Superstructure · Elevated Slabs ─────────────────
  {
    id: "sup-elevated",
    track: "superstructure",
    category: "Elevated Slabs",
    title: "Elevated Slabs: Composite Deck, Precast Plank & Post-Tension",
    summary:
      "Floors above grade are built three very different ways, and which one the drawings show changes your shoring, your pour logic, and what you can never cut later.",
    minutes: 5,
    keyTerms: [
      { term: "Composite metal deck", definition: "Corrugated steel deck that acts as both the concrete form and, via shear studs, part of the finished structural floor over a steel frame." },
      { term: "Post-tensioned (PT) slab", definition: "A cast-in-place concrete slab with high-strength tendons that are stressed after the concrete cures, letting thinner slabs span farther — common in concrete-frame residential/parking." },
      { term: "Reshoring", definition: "Temporary supports left (or replaced) under a freshly poured slab to carry its weight to floors below until it reaches strength — pulling shores early is a collapse risk." },
    ],
    body: [
      {
        heading: "Three systems, three jobsites",
        bullets: [
          "Composite metal deck on steel: deck is laid and welded/screwed, edge forms and pour stops set, reinforcement and studs placed, then a concrete topping pour. Fast and dry-trade-friendly; the coordination is deck openings and embeds for the trades below.",
          "Precast concrete plank (hollowcore) or double-tees: shop-fabricated members craned into place and topped with a thin concrete pour. Very fast erection but a long-lead, early-commitment product with tight tolerances and grouted keyways.",
          "Cast-in-place / post-tensioned concrete: formwork and shoring, rebar and PT tendons, pour, cure, then stress the tendons to a specified elongation. Thin, long-spanning, and the default for many concrete residential and parking structures.",
        ],
      },
      {
        heading: "What the PM has to protect",
        paragraphs: [
          "The dangerous, non-obvious rules live in the temporary condition. Formwork and shoring/reshoring design is engineered — you cannot strip forms or pull shores until the slab has the strength the engineer requires, and a multi-story concrete building carries fresh pours down through several floors of reshoring at once. On post-tensioned slabs, the tendons are live: coring, drilling, or saw-cutting a PT slab without locating tendons (GPR scan first) can sever one under thousands of pounds of force — a life-safety event, not a repair. Mark PT slabs, control who penetrates them, and make tendon location a required step in the penetration permit.",
        ],
      },
      {
        heading: "Coordination that has to happen before the pour",
        bullets: [
          "Sleeves, block-outs, and embeds for MEP, plumbing risers, and hangers go in before the pour — after cure, every penetration is a scan-and-core operation.",
          "Deck/slab edge, stair, and elevator openings are laid out from the structural and architectural sets together, so they don't fight the shaft or stair dimensions.",
          "Camber and deflection: long spans deflect; flooring and partition details above have to tolerate it, and stored materials shouldn't overload a slab still gaining strength.",
        ],
      },
    ],
    relatedLessonIds: ["tech-steel", "tech-concrete", "tech-framing"],
  },

  // ─────────────── Interior Rough-Ins & MEP · Interior Framing ───────────────
  {
    id: "im-framing",
    track: "interior-mep",
    category: "Interior Framing",
    title: "Interior Framing: Partitions, Backing & In-Wall Coordination",
    summary:
      "Laying out interior walls is where the whole finish phase gets set up to succeed or fail — the studs are easy; the backing, the rated walls, and letting MEP in before you close up are the job.",
    minutes: 5,
    keyTerms: [
      { term: "Layout / chalk lines", definition: "Snapping the wall lines on the deck from the dimensioned plans — every downstream trade's position is inherited from this, so it's verified against the drawings before track is fastened." },
      { term: "In-wall backing / blocking", definition: "Steel plate or plywood added inside the wall before drywall to support things hung later — grab bars, TVs, casework, handrails, wall-mounted fixtures." },
      { term: "Rated / smoke partition", definition: "A wall assembly with a fire or smoke rating that has to be built to a specific listed detail, run to the correct height (often deck-to-deck), and firestopped at every penetration." },
    ],
    body: [
      {
        heading: "Framing is a coordination scope disguised as a labor scope",
        paragraphs: [
          "Interior framing (metal stud on most commercial work, wood on light residential) is quick to stand up, which fools people into treating it as a simple trade. It isn't — it's the trade that sets the position and readiness of everything after it. Wall layout is verified against the architectural plans before track is shot to the deck, because a partition six inches off relocates a door, a fixture, and a ceiling grid line. And walls don't close until the trades that live inside them are done and inspected — framing that races ahead of MEP just gets reopened.",
        ],
      },
      {
        heading: "The two things people forget until it's too late",
        bullets: [
          "Backing/blocking: grab bars, wall-hung casework, TVs, handrails, monitors, and toilet accessories all need in-wall support installed before drywall. There is no backing schedule fairy — the PM walks the plans and elevations and confirms every wall-hung item has blocking, because adding it after drywall means cutting the finished wall open.",
          "Rated and smoke walls: these are built to a specific UL/listed assembly, run to the required height (many go deck-to-deck, not just to the ceiling), and every pipe, duct, and cable through them gets a matched firestop system. Head-of-wall and control joints follow the listing. Getting the rating wrong is a life-safety and CO problem, not a cosmetic one.",
        ],
      },
      {
        heading: "Sequencing with the systems inside the wall",
        bullets: [
          "Frame walls → let plumbing, electrical, low-voltage, and mechanical rough-in run → in-wall/insulation inspection → then close the wall. The 'cover' inspection is the hard gate.",
          "Door and borrowed-lite openings are framed to the frame manufacturer's rough-opening dimensions, not the nominal wall dimension.",
          "Ceiling heights and soffits are framed off the RCP (see What Is an RCP) so lights, diffusers, and sprinklers land where the reflected ceiling plan shows them.",
        ],
      },
    ],
    relatedLessonIds: ["tech-mep-coordination", "cn-rcp", "tech-finishes"],
  },

  // ─────────── Interior Finishes · Insulation, Drywall & Paint ───────────
  {
    id: "fin-drywall-paint",
    track: "finishes",
    category: "Insulation, Drywall & Paint",
    title: "Insulation, Drywall & Paint",
    summary:
      "The trades that turn a framed shell into rooms — and the finish-level and moisture decisions that either disappear into a clean wall or become a lit-up dispute.",
    minutes: 5,
    keyTerms: [
      { term: "Finish level (GA Levels 0–5)", definition: "The gypsum-finishing standard. Level 4 suits typical paint; Level 5 (a full skim coat) is required where critical/raking light would reveal joints. They're priced differently and specified per area." },
      { term: "Hang / tape / float / sand", definition: "The drywall sequence: hang the board, tape and mud the joints, float additional coats smooth, then sand — each coat needs dry time, so it paces the schedule." },
      { term: "Cover / insulation inspection", definition: "The AHJ (and often energy-code) inspection of framing, in-wall MEP, and insulation that must pass before drywall closes the wall." },
    ],
    body: [
      {
        heading: "You only close the wall once",
        paragraphs: [
          "Insulation and drywall are the point of no return for everything behind them. Before a single sheet goes up, the in-wall rough-ins are complete and the cover/insulation inspection has passed — because opening a finished, painted wall to add a forgotten pipe or a missed piece of backing is the most demoralizing rework on the job. Thermal and acoustic insulation goes in per the drawings (acoustic batts at demising and conference walls are a real, specified scope, not an afterthought), then board.",
        ],
      },
      {
        heading: "Drywall: where the finish level fight lives",
        bullets: [
          "Fire-rated areas get fire-taping (a rating requirement) even where they're concealed; finished areas get the specified GA finish level.",
          "Level 5 vs. Level 4 is a money-and-schedule item: specify and confirm it before paint, and inspect the surface under raking/wall-wash light before the first coat — after paint, a wavy wall is a dispute with no clean answer.",
          "Moisture-resistant and abuse-resistant board, cement board at wet walls, and shaftwall at rated shafts are all distinct products the plans call out by location.",
        ],
      },
      {
        heading: "Paint: prep is the product",
        bullets: [
          "Prime-and-first-coat typically happens before flooring, trim, and finish hardware go in, so overspray and rolling don't damage finished surfaces; the final coat comes after trim-out for a clean cut line.",
          "The visible quality of paint is 90% surface prep and lighting — hold the drywall finish accountable before you let paint 'fix' it, because paint reveals defects, it doesn't hide them.",
          "Protection starts now: masking, floor protection, and keeping other trades out of a painted room is what keeps the punch list short (see Interior Finishes: Sequence and Protection).",
        ],
      },
    ],
    relatedLessonIds: ["tech-finishes", "im-framing", "wf-quality"],
  },

  // ─────────────── Interior Finishes · Ceilings & Flooring ───────────────
  {
    id: "fin-ceilings-flooring",
    track: "finishes",
    category: "Ceilings & Flooring",
    title: "Ceilings & Flooring",
    summary:
      "The two big-area finishes — overhead and underfoot — each gated by something invisible: what's above the grid, and how much moisture is in the slab.",
    minutes: 5,
    keyTerms: [
      { term: "ACT (acoustical ceiling tile)", definition: "The drop-in tile-and-grid ceiling; the grid is laid out from the RCP and can't close until everything above it is installed and inspected." },
      { term: "Slab moisture testing (ASTM F2170 / F1869)", definition: "Relative-humidity probe or calcium-chloride testing that proves a slab is dry enough to receive resilient flooring — the gate that prevents adhesive failures." },
      { term: "LVT / resilient flooring", definition: "Luxury vinyl tile/plank and sheet goods — moisture-sensitive glue-down floors whose failures trace almost entirely to wet slabs and bad substrate prep." },
    ],
    body: [
      {
        heading: "Ceilings: nothing closes until above is done",
        paragraphs: [
          "The ceiling is a coordination checkpoint as much as a finish. The grid is set from the reflected ceiling plan so lights, diffusers, sprinkler heads, and speakers land where the RCP shows them — and the tile does not go in until every trade above the ceiling has finished and the above-ceiling inspection has passed. Dropping tile early just means pulling it back out for the one duct connection or fire-alarm device that wasn't done. Hard (drywall) ceilings, clouds, and exposed-structure ceilings each carry their own coordination and painting sequence.",
        ],
      },
      {
        heading: "Flooring: the slab decides",
        bullets: [
          "Moisture is the whole game for glue-down floors — RH probe testing per ASTM F2170 on every slab receiving resilient flooring, and the readings have to meet the manufacturer's limit or the warranty (and the floor) is void.",
          "Substrate prep — flatness, crack and joint treatment, self-leveling underlayment — is what telegraphs (or doesn't) through thin flooring; big-format tile and LVT punish an unflat slab.",
          "Tile assemblies add waterproofing at wet areas, movement joints per TCNA, and setting materials matched to the substrate; sequence wet-area waterproofing and its flood test before tile.",
        ],
      },
      {
        heading: "Sequence and protection",
        bullets: [
          "General order: hard flooring after painting's first coats and before final trim-out, with carpet and the most delicate finishes last so following trades don't wreck them.",
          "Transitions and thresholds between flooring types are detail-and-schedule items — the accessible route can't have a lip that exceeds code (see Pedestrian Design & the Accessible Route).",
          "Protect finished floors immediately — ram board and traffic control — and charge damage back to the trade that caused it, with a daily-log photo.",
        ],
      },
    ],
    relatedLessonIds: ["tech-finishes", "cn-rcp", "wf-quality"],
  },

  // ─────────── Interior Finishes · Millwork, Doors & Hardware ───────────
  {
    id: "fin-millwork",
    track: "finishes",
    category: "Millwork, Doors & Hardware",
    title: "Millwork, Casework, Doors & Hardware",
    summary:
      "Shop-built and schedule-driven: the items that must be measured off real walls, ordered long before they install, and coordinated with power and low-voltage months in advance.",
    minutes: 5,
    keyTerms: [
      { term: "Field-verify / field dimensions", definition: "Measuring the actual built condition (after walls exist) before releasing millwork to fabrication — because casework built to the plan dimension won't fit the wall that got built." },
      { term: "Hardware schedule / hardware sets", definition: "The door-by-door listing of every hinge, lock, closer, and accessory (the 'set'), coordinated with ratings, egress, and electrified functions — its own specialty discipline." },
      { term: "Keying meeting", definition: "The early owner sit-down that fixes the master/grand-master keying hierarchy, because cylinders and cores are long-lead and can't wait for the end of the job." },
    ],
    body: [
      {
        heading: "These are procurement items, not just install items",
        paragraphs: [
          "Millwork, casework, doors, frames, and finish hardware share a trap: they're finish-phase installs but early-phase decisions. Shop drawings and submittals go out early, fabrication takes weeks, and the products land near the end — so a submittal that slips or a field dimension taken too late shows up as a gap at the end of the job when there's no schedule left to recover. Treat them like the long-lead procurement they are, tracked on the submittal and delivery logs from buyout, not picked up when the drywall is done.",
        ],
      },
      {
        heading: "Millwork & casework",
        bullets: [
          "Field-verify before fabrication — dimensions come off the built walls, not the plans, and blocking/backing for wall-hung casework had to be installed back at framing (see Interior Framing).",
          "Coordinate the services that die into casework: power, data, and plumbing at reception desks, nurse stations, and break rooms are laid out with the shop drawings, not discovered at install.",
          "Protect and install late — casework and finished millwork go in after the messy, wet trades are done and the room can be kept clean.",
        ],
      },
      {
        heading: "Doors, frames & hardware: the coordination black hole",
        bullets: [
          "Frames often set during framing/drywall; doors and hardware hang much later — so the frame, the rating, the handing, and the hardware set all have to agree across submittals made months apart.",
          "Ratings and egress drive hardware: rated doors need rated assemblies and self-closing/latching hardware; egress doors need panic/exit devices and the right locking function — a code and life-safety issue, inspected before CO.",
          "Electrified hardware (electric strikes, mag locks, card readers, request-to-exit) needs power and low-voltage rough-in decided and installed long before the door hangs — this is where access control and the door schedule have to be reconciled early.",
          "Hold the keying meeting early so cores/cylinders can be ordered; construction cores let the site stay secure until the owner's permanent keying drops in at turnover.",
        ],
      },
    ],
    relatedLessonIds: ["tech-finishes", "wf-submittals", "im-framing"],
  },

  // ──────────── Interior Finishes · MEP Trim-Out & Equipment ────────────
  {
    id: "fin-mep-trim",
    track: "finishes",
    category: "MEP Trim-Out & Equipment",
    title: "MEP Trim-Out: Fixtures, Devices & Registers",
    summary:
      "The visible half of MEP — the fixtures, devices, and grilles that go on last, whose 'percent complete' the whole team can finally see, and which set up startup and the final inspection.",
    minutes: 5,
    keyTerms: [
      { term: "Trim-out", definition: "The finish phase of MEP: installing the visible components — light fixtures, outlets and switches, plumbing fixtures, diffusers/registers, and fire-alarm devices — after the walls and ceilings are finished." },
      { term: "Devices", definition: "The electrical/low-voltage endpoints set at trim — receptacles, switches, data jacks, thermostats, occupancy sensors, and alarm devices." },
      { term: "Fixture connection", definition: "The final tie-in of a light, plumbing fixture, or piece of equipment to the rough-in that was installed and inspected months earlier." },
    ],
    body: [
      {
        heading: "Trim-out is where rough-in gets graded",
        paragraphs: [
          "Every MEP scope runs in two passes: the concealed rough-in early, and the visible trim-out at the very end. Trim-out is when light fixtures hang, devices and plates go on, plumbing fixtures set, diffusers and registers drop into the ceiling grid, and fire-alarm devices mount. It's the first time 'percent complete' on an MEP subcontract is visible to everyone — and it exposes anything the rough-in got wrong, because a device that lands two inches into a door swing or a diffuser that fights a light fixture traces straight back to coordination that was skipped months ago.",
        ],
      },
      {
        heading: "Sequence with the finishes, not against them",
        bullets: [
          "Trim happens after painting and ceilings so fixtures and plates land on finished surfaces — but before the very last cleaning and owner walk.",
          "Fixture and device locations come off the RCP and the finish elevations; coordinate cover-plate colors, fixture types, and trim finishes from the approved submittals, not field guesses.",
          "Owner-furnished equipment (FF&E, appliances, AV, specialty medical/lab equipment) needs its rough-in, power, and connections coordinated from a vendor's cut sheets — the gaps between the GC's scope and the owner's vendors are the PM's to find (see Elevators & Low Voltage).",
        ],
      },
      {
        heading: "Trim-out feeds the finish line",
        bullets: [
          "You can't start up a system that isn't trimmed — energized devices, set fixtures, and connected equipment are the precondition for HVAC balancing, controls point-to-point, and the fire-alarm acceptance test (see Startup, Testing & Commissioning).",
          "Trim is punch-list-dense: wrong finishes, damaged plates, and missed devices are exactly what the owner walk catches, so a self-punch at trim keeps the official punch list short.",
          "Protect and verify: a trimmed room is a finished room — control access, and confirm every device works before the space is called complete.",
        ],
      },
    ],
    relatedLessonIds: ["tech-mep-coordination", "tech-vertical-lv", "mep-startup-cx"],
  },

  // ─────────── Commissioning, Closeout · Final Inspections & CO ───────────
  {
    id: "co-inspections-co",
    track: "closeout",
    category: "Final Inspections & CO",
    title: "Final Inspections & the Certificate of Occupancy",
    summary:
      "The gauntlet of sign-offs that stands between a finished building and a legally occupiable one — sequenced right, it's a week; sequenced wrong, it's the reason everyone's move-in date slips.",
    minutes: 5,
    keyTerms: [
      { term: "Certificate of Occupancy (CO)", definition: "The AHJ's document authorizing legal occupancy — issued only after every required final inspection passes. No CO, no move-in, no matter how done the building looks." },
      { term: "TCO (Temporary CO)", definition: "A conditional, time-limited occupancy approval granted with a short punch of outstanding items — useful to hit a move-in date, but it comes with a deadline and conditions." },
      { term: "Acceptance test", definition: "A witnessed functional test (fire alarm, sprinkler, emergency power, elevator) the AHJ requires before signing off its discipline — a hard, scheduled gate, not a walk-through." },
    ],
    body: [
      {
        heading: "The CO is an AND gate",
        paragraphs: [
          "The Certificate of Occupancy is issued only when every required final inspection has passed — building, electrical, mechanical, plumbing, fire, health, and accessibility, plus any site/civil finals (paving, grading, stormwater as-builts). It's a logical AND: one failed inspection holds the whole CO, and therefore the owner's move-in, financing draw, and the start of the warranty clock. That makes the final-inspection phase a sequencing problem the PM owns from months out, not a formality at the end.",
        ],
      },
      {
        heading: "The inspections that actually gate you",
        bullets: [
          "Fire marshal: the witnessed fire-alarm and suppression acceptance tests are the hardest gate — every device exercised, every interface (elevator recall, door release, HVAC shutdown) proven. Failing reschedules everything behind it (see Fire Protection & Life Safety).",
          "Accessibility (ADA/ANSI): the inspector measures — door forces, clearances, ramp slopes, restroom dimensions, counter heights, signage. These are built-in, not fixable at final, so they're verified during construction, not discovered here.",
          "Health department: required for food service, medical, childcare, and similar occupancies, with its own equipment and finish requirements.",
          "Elevator: a separate state/jurisdictional agency with its own backlog — book it early; its certificate is often a CO prerequisite.",
          "Emergency power and life safety: generator/ATS test, egress lighting, exit signage — witnessed as a system.",
        ],
      },
      {
        heading: "Running the gauntlet without slipping",
        bullets: [
          "Sequence and pre-inspect: many disciplines require rough and final in order, and some finals depend on others (fire alarm before, or with, the fire marshal walk). Build the dependency chain backward from the target CO date and pre-punch each discipline before you call the inspector.",
          "TCO as a tool, not a rescue: if a few non-life-safety items linger, a Temporary CO can protect a move-in date — but it carries conditions and an expiration, so treat it as a managed plan, not a way to paper over unfinished life-safety work.",
          "Documentation travels with the inspection: special-inspection reports, firestop logs, test-and-balance reports, and commissioning results are what let an inspector sign off — a missing report stops a passing building.",
          "One failed final is a schedule event: it doesn't just re-book that inspector, it can cascade into the others and the elevator agency, so a first-pass failure is worth real over-preparation to avoid.",
        ],
      },
    ],
    relatedLessonIds: ["wf-punch-closeout", "tech-testing-cx", "tech-fire", "wf-permits"],
  },
];
