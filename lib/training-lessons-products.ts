/**
 * "Common Products & Materials" track additions — one sibling lesson per
 * construction-trade module (CSI division). Each trade the curriculum teaches
 * gets a companion lesson surveying the common products a PM buys, submits,
 * and installs for that division, with a picture gallery whose cards link to
 * manufacturer spec sheets, data sheets, and CAD/BIM on ARCAT
 * (https://www.arcat.com), the industry's product/spec library.
 *
 * These lessons live in the SAME track + category as their parent trade
 * module (via a shared `category`), so each shows up right next to the module
 * it complements in the Training Modules nav tree. The parent modules link
 * back via relatedLessonIds.
 *
 * Client-safe; imports only types from training-lessons (no runtime cycle).
 * The `icon` on each product is a key into ProductIcon's inline-SVG library
 * (app/training/lessons/[lessonId]/LessonDetailClient.tsx) — the "pictures"
 * are self-contained so they always render, and the `specUrl` carries the
 * real link out to the product's category on ARCAT.
 */

import type { Lesson, LessonLink } from "./training-lessons";

const PRACTICE_LINK: LessonLink = {
  label: "Practice this in your training sandbox",
  href: "/training/practice",
};

/** ARCAT product-library base — every division browses off this path. */
const ARCAT = "https://www.arcat.com/content-type/product";

/**
 * The shared teaching block every products lesson opens with: how a PM
 * actually uses this gallery — product data becomes a submittal, and the
 * "basis of design / or-equal" language on the spec is what governs
 * substitutions. Kept identical across lessons on purpose (it's the reusable
 * literacy), with a per-lesson intro paragraph in front of it.
 */
function howToUseBlock() {
  return {
    heading: "How to use a product spec sheet",
    paragraphs: [
      "Every product below is chosen against a three-part CSI specification: Part 1 (general/submittal requirements), Part 2 (products — the actual materials, often naming a \"basis of design\" manufacturer plus \"or-equal\" language), and Part 3 (execution — how it's installed). The manufacturer's product data sheet is what you match against that spec, and it becomes the core of the submittal the design team approves before anything is ordered.",
      "When you open a spec sheet from a card below, read for the numbers that drive approval and coordination: performance ratings (PSI, R-value, fire rating, UL listing), sizes and gauges, finishes, and the standards it's tested to (ASTM, ANSI, NFPA). Those are the fields a reviewer checks a submittal against — and the ones a substitution ('or-equal') has to match to be accepted.",
    ],
  };
}

const KEY_TERMS = [
  { term: "Product data sheet", definition: "The manufacturer's document listing a product's sizes, performance ratings, finishes, and tested standards — the heart of a product-data submittal." },
  { term: "Basis of design", definition: "The specific manufacturer/product the specifier designed around; substitutions must be shown 'or-equal' to it to be accepted." },
  { term: "Or-equal / substitution", definition: "A proposed alternate product the contractor submits as equivalent to the basis of design — approved only if it meets every governing spec requirement." },
];

export const PRODUCTS_LESSONS: Lesson[] = [
  // ───────────────────────── Div 03 · Concrete ─────────────────────────
  {
    id: "tech-concrete-products",
    track: "substructure",
    category: "Slab on Grade & Concrete",
    title: "Concrete: Common Products & Materials",
    summary:
      "The everyday products behind a concrete package — ready-mix, reinforcing, formwork, and grout — and what to check on each spec sheet.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "What you're actually buying",
        paragraphs: [
          "A concrete package is more than trucks of gray mud. It's a coordinated set of products — the mix design itself, the reinforcing steel that carries tension, the formwork that shapes and supports it until it cures, and the grouts and admixtures that solve the special conditions. Each is a submittal, and each has a spec sheet with the numbers that govern acceptance.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Ready-Mix Concrete & Admixtures", csi: "CSI 03 30 00", description: "The mix design itself — strength (PSI), water-cement ratio, and admixtures (air-entrainment, accelerators, retarders) matched per placement.", icon: "concrete-mix", specUrl: `${ARCAT}/concrete-03` },
      { name: "Reinforcing Steel — Rebar & WWR", csi: "CSI 03 20 00", description: "Deformed bar, welded wire reinforcement, and mesh that carry tension. Grade, size, coating, and lap lengths come from the structural drawings.", icon: "rebar", specUrl: `${ARCAT}/concrete-03` },
      { name: "Formwork & Form Liners", csi: "CSI 03 10 00", description: "Panel systems, ties, shoring, and architectural form liners. The contractor engineers formwork and shoring — a real design responsibility.", icon: "formwork", specUrl: `${ARCAT}/concrete-03` },
      { name: "Non-Shrink & Epoxy Grout", csi: "CSI 03 60 00", description: "Cementitious and epoxy grouts for base plates, anchors, and precision equipment setting — check strength and flow class against the use.", icon: "grout", specUrl: `${ARCAT}/concrete-03` },
    ],
    relatedLessonIds: ["tech-concrete", "tech-foundations", "cn-csi"],
    links: [PRACTICE_LINK, { label: "Browse Division 03 Concrete on ARCAT", href: `${ARCAT}/concrete-03` }],
  },

  // ───────────────────────── Div 05 · Metals ─────────────────────────
  {
    id: "tech-steel-products",
    track: "superstructure",
    category: "Structural Frame",
    title: "Structural Steel & Metals: Common Products",
    summary:
      "Wide-flange framing, deck, connections, and the misc-metals that carry the biggest coordination load — with spec sheets to match.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "From mill to erection",
        paragraphs: [
          "Steel is bought as a fabricated, engineered package: the frame, the deck that spans it, the bolts and welds that connect it, and the miscellaneous metals (stairs, rails, embeds) that stitch the building together. Because steel leads the schedule, getting the right products approved early — via shop drawings and product data — is what keeps the mill slot and the erection crew on track.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Structural Steel Framing", csi: "CSI 05 12 00", description: "Wide-flange beams, columns, HSS, and plate. ASTM grade (A992, A500), camber, and connection type drive fabrication and cost.", icon: "steel-beam", specUrl: `${ARCAT}/metals-05` },
      { name: "Steel Floor & Roof Deck", csi: "CSI 05 31 00", description: "Composite and roof deck — profile, gauge, and finish set the diaphragm capacity and the slab-on-deck that follows.", icon: "steel-deck", specUrl: `${ARCAT}/metals-05` },
      { name: "High-Strength Bolts & Anchors", csi: "CSI 05 05 23", description: "Structural bolts (A325/A490), anchor rods, and embeds. Tensioning method and inspection class are spec'd, not optional.", icon: "fastener", specUrl: `${ARCAT}/metals-05` },
      { name: "Metal Stairs & Railings", csi: "CSI 05 51 00", description: "Pan stairs, guards, and handrails — the classic misc-metals scope, small dollars with many interfaces. Buy early; mine the embed drawings.", icon: "railing", specUrl: `${ARCAT}/metals-05` },
    ],
    relatedLessonIds: ["tech-steel", "cn-longlead", "cn-csi"],
    links: [PRACTICE_LINK, { label: "Browse Division 05 Metals on ARCAT", href: `${ARCAT}/metals-05` }],
  },

  // ─────────────────── Div 04 / 06 · Masonry & Wood ───────────────────
  {
    id: "tech-framing-products",
    track: "superstructure",
    category: "Structural Frame",
    title: "Masonry & Framing: Common Products",
    summary:
      "CMU and veneer, engineered lumber, and cold-formed steel framing — the products that build walls and partitions across Divisions 04, 05, and 06.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "Three ways to build a wall",
        paragraphs: [
          "Walls get built from masonry (CMU and veneer), from wood (dimensional and engineered lumber), or from cold-formed metal studs — often all three on the same building. Each is a product family with its own spec sheet: block strength and grout, veneer ties and flashing, engineered-lumber member ratings, and stud gauge and assembly listings. The wall-type schedule maps every partition to one of these, and the rated assemblies are all-or-nothing.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Concrete Masonry Units (CMU)", csi: "CSI 04 22 00", description: "Load-bearing and veneer block, plus grout and reinforcing. Net-area strength, weight class, and integral water repellent govern.", icon: "cmu-block", specUrl: `${ARCAT}/masonry-04` },
      { name: "Brick & Stone Veneer", csi: "CSI 04 20 00", description: "Clay brick, cast stone, and ties/flashing. Veneer is a drainage system — the flashing, weeps, and cavity matter more than the face.", icon: "brick", specUrl: `${ARCAT}/masonry-04` },
      { name: "Engineered Lumber & Trusses", csi: "CSI 06 17 00", description: "LVL, I-joists, glulam, and pre-engineered trusses. They ship with supplier engineering — field-cutting outside allowed zones voids the member.", icon: "lumber", specUrl: `${ARCAT}/wood-plastics-and-composites-06` },
      { name: "Cold-Formed Metal Framing", csi: "CSI 05 40 00", description: "Light-gauge studs and track for partitions and load-bearing mid-rise. Gauge, spacing, and the listed assembly determine the rating.", icon: "metal-stud", specUrl: `${ARCAT}/metals-05` },
    ],
    relatedLessonIds: ["tech-framing", "tech-steel", "cn-csi"],
    links: [
      PRACTICE_LINK,
      { label: "Browse Division 04 Masonry on ARCAT", href: `${ARCAT}/masonry-04` },
      { label: "Browse Division 06 Wood, Plastics & Composites on ARCAT", href: `${ARCAT}/wood-plastics-and-composites-06` },
    ],
  },

  // ─────────────── Div 07 / 08 · Envelope & Openings ───────────────
  {
    id: "tech-envelope-products",
    track: "superstructure",
    category: "Building Envelope",
    title: "Building Envelope: Common Products",
    summary:
      "Roofing membranes, insulation, air/water barriers, doors, and glazing — the Division 07 and 08 products that keep water and air out.",
    minutes: 6,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "Products are the layers",
        paragraphs: [
          "The envelope is four continuous control layers — water, air, vapor, thermal — assembled from specific products: the roofing membrane, the insulation, the air/water-resistive barrier, and the openings (doors, windows, curtain wall) that punch through them. The products rarely fail; the transitions between them do. So the spec sheet you care about is often the flashing and sealant detail as much as the panel itself.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Single-Ply Roofing Membranes", csi: "CSI 07 54 00", description: "TPO, EPDM, and PVC membranes with tapered insulation. Thickness, attachment, and the NDL warranty inspections drive the install.", icon: "roofing", specUrl: `${ARCAT}/thermal-and-moisture-protection-07` },
      { name: "Board & Batt Insulation", csi: "CSI 07 21 00", description: "Rigid board (polyiso, mineral wool) and batt/blanket. R-value, fire performance, and continuity at the thermal layer are what matter.", icon: "insulation", specUrl: `${ARCAT}/thermal-and-moisture-protection-07` },
      { name: "Air & Water-Resistive Barriers", csi: "CSI 07 27 00", description: "Sheet and fluid-applied WRB/air barriers plus flashing. The drainage plane windows and cladding must integrate into, shingle-style.", icon: "barrier", specUrl: `${ARCAT}/thermal-and-moisture-protection-07` },
      { name: "Exterior Doors & Frames", csi: "CSI 08 11 00", description: "Hollow-metal and aluminum entrances with hardware. Fire rating, thermal break, and the hardware schedule govern approval.", icon: "door", specUrl: `${ARCAT}/openings-08` },
      { name: "Windows & Curtain Wall", csi: "CSI 08 44 00", description: "Storefront, punched windows, and stick/unitized curtain wall. Air/water ratings (ASTM) and glazing performance (SHGC, U-factor) lead.", icon: "curtain-wall", specUrl: `${ARCAT}/openings-08` },
    ],
    relatedLessonIds: ["tech-envelope", "cn-longlead", "cn-csi"],
    links: [
      PRACTICE_LINK,
      { label: "Browse Division 07 Thermal & Moisture Protection on ARCAT", href: `${ARCAT}/thermal-and-moisture-protection-07` },
      { label: "Browse Division 08 Openings on ARCAT", href: `${ARCAT}/openings-08` },
    ],
  },

  // ─────────────────── Div 21 · Fire Suppression ───────────────────
  {
    id: "tech-fire-products",
    track: "interior-mep",
    category: "Wet Systems & Fire Protection",
    title: "Fire Protection: Common Products",
    summary:
      "Sprinklers, pumps, standpipes, and valves — the Division 21 products the fire marshal tests hardest, right before you need the CO.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "Life-safety products carry listings, not just specs",
        paragraphs: [
          "Fire suppression products live and die by their listings (UL/FM) and the NFPA standards they're installed to (NFPA 13 for sprinklers, NFPA 20 for pumps, NFPA 14 for standpipes). Sprinkler layout is usually delegated engineering, so the shop drawings carry a PE stamp — and the products on them (heads, pipe, valves, the pump) all trace back to listed data sheets the AHJ can check.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Sprinklers & Heads", csi: "CSI 21 13 00", description: "Wet, dry, and pre-action heads by response and temperature rating. Coverage and K-factor come from the hazard classification.", icon: "sprinkler", specUrl: `${ARCAT}/fire-suppression-21` },
      { name: "Fire Pumps", csi: "CSI 21 30 00", description: "Electric and diesel fire pumps (NFPA 20) for tall or high-demand buildings. The witnessed pump test is its own acceptance event.", icon: "pump", specUrl: `${ARCAT}/fire-suppression-21` },
      { name: "Standpipe & Hose Systems", csi: "CSI 21 10 00", description: "Standpipe risers, hose valves, and connections (NFPA 14) serving stairwells and floors in mid- and high-rise buildings.", icon: "pipe", specUrl: `${ARCAT}/fire-suppression-21` },
      { name: "Valves & Backflow Preventers", csi: "CSI 21 11 00", description: "Control, check, and backflow-prevention assemblies feeding the system — the water-authority interface that brings the utility into your schedule.", icon: "valve", specUrl: `${ARCAT}/fire-suppression-21` },
    ],
    relatedLessonIds: ["tech-fire", "tech-mep-coordination", "cn-csi"],
    links: [PRACTICE_LINK, { label: "Browse Division 21 Fire Suppression on ARCAT", href: `${ARCAT}/fire-suppression-21` }],
  },

  // ─────────────── Div 22 / 23 / 26 · MEP Products ───────────────
  {
    id: "tech-mep-products",
    track: "interior-mep",
    category: "Rough-In Coordination",
    title: "MEP: Common Products & Equipment",
    summary:
      "Pipe and water heaters, rooftop units and ductwork, panelboards and lighting — the Division 22, 23, and 26 products that fill every wall and ceiling.",
    minutes: 6,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "The products behind the coordination war",
        paragraphs: [
          "MEP is where the most products go into the building — and where they all compete for the same wall cavities and ceiling space. Plumbing (pipe, fixtures, water heaters), mechanical (rooftop units, air handlers, ductwork, diffusers), and electrical (switchgear, panelboards, conduit, lighting) each carry equipment submittals with cut sheets, and the long-lead pieces (switchgear, big HVAC) get released at buyout, not when the field needs them.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Pipe, Fittings & Valves", csi: "CSI 22 11 00", description: "Domestic water, sanitary/vent, and gas piping by material (copper, PEX, cast iron, steel). Pressure rating and joining method are spec'd.", icon: "pipe", specUrl: `${ARCAT}/plumbing-22` },
      { name: "Water Heaters & Plumbing Equipment", csi: "CSI 22 30 00", description: "Tank and tankless heaters, pumps, and fixtures. Capacity, recovery rate, and energy factor drive selection and gas/electric rough-in.", icon: "water-heater", specUrl: `${ARCAT}/plumbing-22` },
      { name: "Rooftop Units & Air Handlers", csi: "CSI 23 74 00", description: "Packaged RTUs, AHUs, and split systems — often long-lead. Tonnage, airflow, and electrical/curb requirements coordinate structure and roofing.", icon: "hvac-unit", specUrl: `${ARCAT}/heating-ventilating-and-air-conditioning-hvac-23` },
      { name: "Ductwork & Air Distribution", csi: "CSI 23 31 00", description: "Sheet-metal duct, insulation, VAV boxes, diffusers, and grilles. Gauge, sealing class, and the RCP coordination govern the install.", icon: "duct", specUrl: `${ARCAT}/heating-ventilating-and-air-conditioning-hvac-23` },
      { name: "Switchgear & Panelboards", csi: "CSI 26 24 00", description: "Service entrance, distribution, and branch panels — the project's longest electrical lead. Ampacity, AIC rating, and gear layout lead design.", icon: "panelboard", specUrl: `${ARCAT}/electrical-26` },
      { name: "Lighting Fixtures & Controls", csi: "CSI 26 51 00", description: "Interior/exterior luminaires and lighting controls. Lumen output, efficacy, color temperature, and control compatibility are the review fields.", icon: "light", specUrl: `${ARCAT}/electrical-26` },
    ],
    relatedLessonIds: ["tech-mep-coordination", "cn-mep", "cn-longlead"],
    links: [
      PRACTICE_LINK,
      { label: "Browse Division 22 Plumbing on ARCAT", href: `${ARCAT}/plumbing-22` },
      { label: "Browse Division 23 HVAC on ARCAT", href: `${ARCAT}/heating-ventilating-and-air-conditioning-hvac-23` },
      { label: "Browse Division 26 Electrical on ARCAT", href: `${ARCAT}/electrical-26` },
    ],
  },

  // ───────────────────────── Div 09 · Finishes ─────────────────────────
  {
    id: "tech-finishes-products",
    track: "finishes",
    category: "Finishes Sequence",
    title: "Interior Finishes: Common Products",
    summary:
      "Gypsum board, ceilings, flooring, tile, and paint — the Division 09 products where quality is most visible and damage is easiest.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "The most visible products on the job",
        paragraphs: [
          "Finishes are the products the owner sees and touches, so their spec sheets carry the aesthetic requirements (color, texture, finish level) alongside performance (fire rating, slip resistance, acoustics). They also install in a strict sequence that's really a protection strategy — every trade re-entering a finished room risks damaging someone else's product.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Gypsum Board & Assemblies", csi: "CSI 09 21 00", description: "Regular, Type X, abuse- and moisture-resistant board with the framing and finishing. The UL assembly — not just the board — sets the rating.", icon: "drywall", specUrl: `${ARCAT}/finishes-09` },
      { name: "Acoustical Ceilings", csi: "CSI 09 51 00", description: "Tile-and-grid systems by NRC/CAC, edge detail, and grid finish. Everything above the grid must be inspected before it closes up.", icon: "ceiling", specUrl: `${ARCAT}/finishes-09` },
      { name: "Resilient & Wood Flooring", csi: "CSI 09 60 00", description: "LVT, sheet vinyl, rubber, and wood. Slab moisture (ASTM F2170) and adhesive compatibility make or break the install.", icon: "flooring", specUrl: `${ARCAT}/finishes-09` },
      { name: "Tile & Stone", csi: "CSI 09 30 00", description: "Ceramic, porcelain, and stone with setting/waterproofing systems. Movement joints (TCNA) and substrate matched to the tile size govern.", icon: "tile", specUrl: `${ARCAT}/finishes-09` },
      { name: "Paints & Coatings", csi: "CSI 09 90 00", description: "Primers, finish coats, and high-performance coatings. Sheen, VOC limits, and the substrate-specific system are the submittal fields.", icon: "paint", specUrl: `${ARCAT}/finishes-09` },
    ],
    relatedLessonIds: ["tech-finishes", "wf-punch-closeout", "cn-csi"],
    links: [PRACTICE_LINK, { label: "Browse Division 09 Finishes on ARCAT", href: `${ARCAT}/finishes-09` }],
  },

  // ─────────────── Div 14 / 27 / 28 · Conveying & Low Voltage ───────────────
  {
    id: "tech-vertical-lv-products",
    track: "finishes",
    category: "MEP Trim-Out & Equipment",
    title: "Elevators & Low Voltage: Common Products",
    summary:
      "Elevators, structured cabling, cameras, and access control — the Division 14, 27, and 28 products bought first and finished last.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "Long-lead equipment and growing low-voltage scope",
        paragraphs: [
          "Elevators combine the longest procurement in the building with the last acceptance test before occupancy, so the product (hydraulic vs. traction/MRL) is selected and released at buyout. Meanwhile low-voltage scope grows every year — structured cabling, video surveillance, and access control are their own product families with their own submittals, pathways, and rooms that need power and cooling before the racks land.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Elevators & Lifts", csi: "CSI 14 20 00", description: "Hydraulic and traction/MRL elevators plus platform lifts. Capacity, speed, and hoistway/pit requirements interface with structure and power.", icon: "elevator", specUrl: `${ARCAT}/conveying-equipment-14` },
      { name: "Structured Cabling & Pathways", csi: "CSI 27 10 00", description: "Copper/fiber cabling, racks, and the tray/J-hook pathways. MDF/IDF rooms need power, cooling, and dust-free finishes before install.", icon: "cabling", specUrl: `${ARCAT}/communications-27` },
      { name: "Video Surveillance (CCTV)", csi: "CSI 28 23 00", description: "IP cameras, NVRs, and management software. Camera type, resolution, and PoE budget coordinate with the network and power design.", icon: "camera", specUrl: `${ARCAT}/electronic-safety-and-security-28` },
      { name: "Access Control", csi: "CSI 28 13 00", description: "Readers, controllers, electric strikes, and mag locks. These interface with the door hardware schedule — decided before doors hang, not after.", icon: "keypad", specUrl: `${ARCAT}/electronic-safety-and-security-28` },
    ],
    relatedLessonIds: ["tech-vertical-lv", "cn-longlead", "cn-csi"],
    links: [
      PRACTICE_LINK,
      { label: "Browse Division 14 Conveying Equipment on ARCAT", href: `${ARCAT}/conveying-equipment-14` },
      { label: "Browse Division 27 Communications on ARCAT", href: `${ARCAT}/communications-27` },
      { label: "Browse Division 28 Electronic Safety & Security on ARCAT", href: `${ARCAT}/electronic-safety-and-security-28` },
    ],
  },

  // ─────────────── Div 31 / 32 / 33 · Sitework & Utilities ───────────────
  {
    id: "tech-sitework-products",
    track: "sitedev",
    category: "Earthwork & Mass Grading",
    title: "Sitework & Utilities: Common Products",
    summary:
      "Geosynthetics, retaining walls, pavement, underground pipe, and hydrants — the Division 31, 32, and 33 products where the biggest early dollars move.",
    minutes: 5,
    keyTerms: KEY_TERMS,
    body: [
      {
        heading: "Products buried before the building exists",
        paragraphs: [
          "Sitework products go in early and mostly disappear — geosynthetics under fill, segmental retaining walls, pavement sections, and the underground utility pipe and structures. Because so much is buried, the spec sheet (pipe class, aggregate gradation, geotextile strength) plus the inspection/testing record is the proof the work was right; you can't uncover it later without paying twice.",
        ],
      },
      howToUseBlock(),
    ],
    products: [
      { name: "Geosynthetics & Erosion Control", csi: "CSI 31 05 00", description: "Geotextiles, geogrids, and erosion-control blankets/silt fence. Strength class and permittivity are spec'd; SWPPP compliance is daily.", icon: "barrier", specUrl: `${ARCAT}/earthwork-31` },
      { name: "Retaining Walls & Segmental Block", csi: "CSI 32 32 00", description: "SRW block, modular, and cast systems with reinforcement. Wall height and surcharge drive the engineered design and geogrid layout.", icon: "wall-block", specUrl: `${ARCAT}/exterior-improvements-32` },
      { name: "Pavement & Unit Pavers", csi: "CSI 32 14 00", description: "Asphalt, concrete pavement, and interlocking pavers. Section thickness, subgrade prep, and ADA slopes govern the flatwork.", icon: "paver", specUrl: `${ARCAT}/exterior-improvements-32` },
      { name: "Storm & Sanitary Pipe / Structures", csi: "CSI 33 40 00", description: "RCP, HDPE, PVC gravity pipe with manholes, inlets, and catch basins. Pipe class, bedding, and slope are inspected before backfill.", icon: "pipe", specUrl: `${ARCAT}/utilities-33` },
      { name: "Fire Hydrants & Water Valves", csi: "CSI 33 10 00", description: "Water main, hydrants, and valves feeding the site and fire service. AWWA compliance and the water-authority approval bring the utility in.", icon: "hydrant", specUrl: `${ARCAT}/utilities-33` },
    ],
    relatedLessonIds: ["tech-sitework", "tech-foundations", "cn-csi"],
    links: [
      PRACTICE_LINK,
      { label: "Browse Division 31 Earthwork on ARCAT", href: `${ARCAT}/earthwork-31` },
      { label: "Browse Division 32 Exterior Improvements on ARCAT", href: `${ARCAT}/exterior-improvements-32` },
      { label: "Browse Division 33 Utilities on ARCAT", href: `${ARCAT}/utilities-33` },
    ],
  },
];
