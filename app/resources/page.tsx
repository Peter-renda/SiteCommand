type ResourceLink = {
  name: string;
  href: string;
  description: string;
  tag?: string;
  internal?: boolean;
};

type ResourceSection = {
  title: string;
  blurb: string;
  links: ResourceLink[];
};

// Curated, authoritative sources for construction project managers and
// superintendents. External links open the official publisher/agency page
// where the current standard, contract form, or free PDF actually lives, so
// the references stay valid as documents are revised.
const SECTIONS: ResourceSection[] = [
  {
    title: "Contract Documents & Project Delivery",
    blurb: "Standard agreements and delivery-method references for buyout and contract administration.",
    links: [
      {
        name: "AIA Contract Documents",
        href: "https://www.aiacontracts.com/",
        description:
          "The industry-standard AIA family — A201 General Conditions, A101 owner/contractor agreement, and the G-series field forms (pay apps, RFIs, change orders).",
        tag: "Contracts",
      },
      {
        name: "ConsensusDocs",
        href: "https://www.consensusdocs.org/",
        description:
          "Coalition-drafted contracts (owner, CM, design-build, subcontract) written from a collaborative, best-for-the-project standpoint.",
        tag: "Contracts",
      },
      {
        name: "EJCDC",
        href: "https://www.ejcdc.org/",
        description:
          "Engineers Joint Contract Documents Committee forms — common on engineered, civil, and public-works projects.",
        tag: "Contracts",
      },
      {
        name: "Design-Build Institute of America (DBIA)",
        href: "https://dbia.org/",
        description:
          "Design-build best practices, standard form contracts, and certification for progressive and fixed-price design-build delivery.",
        tag: "Delivery",
      },
    ],
  },
  {
    title: "Building Codes & Life Safety",
    blurb: "The adopted codes that govern permitting, inspections, and closeout.",
    links: [
      {
        name: "ICC Digital Codes",
        href: "https://codes.iccsafe.org/",
        description:
          "Free online read-only access to the I-Codes (IBC, IRC, IEBC, IPC, IMC). Premium adds search, notes, and offline copies.",
        tag: "Free access",
      },
      {
        name: "NFPA Codes & Standards",
        href: "https://www.nfpa.org/codes-and-standards",
        description:
          "NFPA 70 (National Electrical Code), NFPA 101 Life Safety Code, NFPA 13 sprinklers, and more — with free read-only online access.",
        tag: "Free access",
      },
      {
        name: "ASHRAE Standards & Guidelines",
        href: "https://www.ashrae.org/technical-resources/standards-and-guidelines",
        description:
          "Building-performance standards behind MEP design and commissioning — 90.1 (energy), 62.1 (ventilation), and 55 (thermal comfort).",
        tag: "Standards",
      },
      {
        name: "2010 ADA Standards for Accessible Design",
        href: "https://www.ada.gov/law-and-regs/design-standards/",
        description:
          "The free federal accessibility standard for accessible routes, clearances, ramps, restrooms, and fixtures.",
        tag: "Free PDF",
      },
    ],
  },
  {
    title: "Material & Testing Standards",
    blurb: "Specifications and test methods referenced throughout project specs and submittals.",
    links: [
      {
        name: "ASTM International",
        href: "https://www.astm.org/",
        description:
          "Test methods and material specs for soils, concrete, steel, and asphalt. Search by designation (e.g., C39 concrete strength, D698 Proctor).",
        tag: "Standards",
      },
      {
        name: "American Concrete Institute (ACI)",
        href: "https://www.concrete.org/",
        description:
          "ACI 318 (structural concrete), 301 (specifications), and field references for mix design, placement, and curing.",
        tag: "Standards",
      },
      {
        name: "AISC Steel Standards",
        href: "https://www.aisc.org/publications/steel-standards/",
        description:
          "Free downloads of the AISC Specification (ANSI/AISC 360) and the Code of Standard Practice (303) that governs steel fabrication and erection.",
        tag: "Free access",
      },
      {
        name: "American Welding Society (AWS)",
        href: "https://www.aws.org/",
        description:
          "AWS D1.1 Structural Welding Code — Steel, plus welder and procedure qualification resources.",
        tag: "Standards",
      },
      {
        name: "Concrete Reinforcing Steel Institute (CRSI)",
        href: "https://www.crsi.org/",
        description:
          "Rebar detailing, placing, splicing, and estimating references — handy for reviewing shop drawings.",
        tag: "Reference",
      },
      {
        name: "The Masonry Society (TMS)",
        href: "https://masonrysociety.org/",
        description:
          "TMS 402/602, the design and construction standard for structural masonry.",
        tag: "Standards",
      },
    ],
  },
  {
    title: "Safety & Field Operations",
    blurb: "Jobsite safety regulations and field references — most relevant to superintendents.",
    links: [
      {
        name: "OSHA Construction Regulations (29 CFR 1926)",
        href: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926",
        description:
          "The full construction safety regulations, section by section — excavation, fall protection, scaffolds, electrical, and cranes.",
        tag: "Regulations",
      },
      {
        name: "OSHA Construction Industry",
        href: "https://www.osha.gov/construction",
        description:
          "Hazard topics, compliance assistance, and the Focus Four resources for daily field safety.",
        tag: "Website",
      },
      {
        name: "OSHA Publications Library",
        href: "https://www.osha.gov/publications",
        description:
          "Free downloadable booklets, QuickCards, and fact sheets on trenching, silica, fall protection, and more — good for toolbox talks.",
        tag: "Free PDF",
      },
      {
        name: "USACE Publications (Engineer Manuals)",
        href: "https://www.publications.usace.army.mil/",
        description:
          "Home of EM 385-1-1, the U.S. Army Corps of Engineers Safety & Health Requirements Manual used on most federal work.",
        tag: "Free PDF",
      },
      {
        name: "CPWR — The Center for Construction Research and Training",
        href: "https://www.cpwr.com/",
        description:
          "Toolbox talks, hazard alerts, and training materials built specifically for the field.",
        tag: "Reference",
      },
    ],
  },
  {
    title: "Cost, Estimating & Work Breakdown",
    blurb: "The numbering and cost references behind budgets, buyout, and forecasting.",
    links: [
      {
        name: "Construction Specifications Institute (CSI)",
        href: "https://www.csiresources.org/",
        description:
          "MasterFormat, UniFormat, and SectionFormat — the classification behind spec sections, budget codes, and submittal logs.",
        tag: "Standards",
      },
      {
        name: "Gordian / RSMeans Data",
        href: "https://www.rsmeans.com/",
        description:
          "Localized construction cost data for conceptual estimating, budgeting, and change-order pricing.",
        tag: "Cost data",
      },
      {
        name: "AACE International",
        href: "https://web.aacei.org/",
        description:
          "Cost engineering, the estimate-classification framework, and Total Cost Management resources.",
        tag: "Reference",
      },
      {
        name: "BLS Producer Price Index (Construction)",
        href: "https://www.bls.gov/ppi/",
        description:
          "Track material and construction cost escalation to support buyout timing and forecasting.",
        tag: "Data",
      },
    ],
  },
  {
    title: "Project Management & Professional Development",
    blurb: "Standards of practice, certifications, and lean-delivery methods.",
    links: [
      {
        name: "Project Management Institute (PMI)",
        href: "https://www.pmi.org/",
        description:
          "The PMBOK Guide, PMP/CAPM certification, and general project-management standards.",
        tag: "Website",
      },
      {
        name: "Construction Management Association of America (CMAA)",
        href: "https://www.cmaanet.org/",
        description:
          "CM Standards of Practice and the Certified Construction Manager (CCM) credential.",
        tag: "Website",
      },
      {
        name: "Lean Construction Institute (LCI)",
        href: "https://www.leanconstruction.org/",
        description:
          "The Last Planner System, pull planning, and lean delivery practices for tightening schedules.",
        tag: "Reference",
      },
      {
        name: "Inside SiteCommand: Training & Lessons",
        href: "/training/lessons",
        description:
          "Role-based lessons and a hands-on project simulation built right into SiteCommand — start here to learn the workflows.",
        tag: "In SiteCommand",
        internal: true,
      },
    ],
  },
  {
    title: "Industry News & Associations",
    blurb: "Market data, benchmarking, and the trade associations worth following.",
    links: [
      {
        name: "Engineering News-Record (ENR)",
        href: "https://www.enr.com/",
        description:
          "Industry news, the Construction Cost Index, and the ENR rankings of firms and projects.",
        tag: "News",
      },
      {
        name: "Associated General Contractors (AGC)",
        href: "https://www.agc.org/",
        description:
          "The GC association — standard contract documents, safety programs, education, and market data.",
        tag: "Association",
      },
      {
        name: "Associated Builders and Contractors (ABC)",
        href: "https://www.abc.org/",
        description:
          "Merit-shop association — the STEP safety program, apprenticeship, and advocacy.",
        tag: "Association",
      },
      {
        name: "Construction Financial Management Association (CFMA)",
        href: "https://www.cfma.org/",
        description:
          "Benchmarking, work-in-progress (WIP) reporting, and construction accounting resources.",
        tag: "Reference",
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors">
            SiteCommand
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Resources</span>
        </div>
        <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Back to Dashboard
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Resources</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Standards, contract documents, and field references for project managers and
          superintendents. Links open the official source in a new tab.
        </p>

        <div className="mt-10 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{section.blurb}</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.links.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    {...(link.internal
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                        {link.name}
                      </h3>
                      <svg
                        className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{link.description}</p>
                    {link.tag ? (
                      <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {link.tag}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-gray-400">
          These references point to third-party organizations and agencies. SiteCommand isn&rsquo;t
          affiliated with them, and codes, standards, and contract forms are periodically revised —
          always confirm you&rsquo;re working from the edition your project requires.
        </p>
      </div>
    </main>
  );
}
