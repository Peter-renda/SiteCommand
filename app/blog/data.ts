export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO
  readMinutes: number;
  author: string;
  authorRole: string;
  /** Body paragraphs. Strings beginning with "## " render as subheadings. */
  body: string[];
};

// Hand-authored, career-focused posts about breaking into and running
// construction management. No CMS yet — content lives here and is rendered by
// app/blog/page.tsx (index) and app/blog/[slug]/page.tsx (article).
export const blogPosts: BlogPost[] = [
  {
    slug: "break-into-construction-management-without-a-degree",
    title: "How to break into construction management without a degree",
    excerpt:
      "Construction management is one of the last high-paying careers you can enter on skill instead of a diploma. Here's the honest path in — and what actually gets you hired.",
    category: "Career",
    date: "2026-06-24",
    readMinutes: 7,
    author: "Dana Whitfield",
    authorRole: "Former Senior PM, 14 years",
    body: [
      "There's a myth that you need a four-year construction management degree to work in the trailer. You don't. The field is short on people who can run a job, and general contractors will hire on demonstrated ability far faster than they'll wait for a diploma. What they need is someone who understands how a project actually moves — and can prove it.",
      "## Why the door is open",
      "The industry is facing a demographic cliff. A large share of experienced project managers and superintendents are retiring, and not enough people are coming up behind them. That shortage is why entry-level roles — coordinator, project engineer, assistant project manager — are sitting open, and why compensation climbs quickly for anyone who sticks.",
      "## What actually gets you hired",
      "Three things. First, vocabulary: you have to speak the language of RFIs, submittals, buyout, change orders, and pay applications without hesitating. Second, judgment: knowing what a rim-to-spot-grade conflict means for the schedule, or why a long-lead switchgear order can't wait for the award. Third, reps: evidence that you've done the work, even in a simulated environment, so a hiring manager can picture you on day one.",
      "The degree substitutes for none of those. A candidate who can walk a superintendent through how they'd handle a stalled submittal will beat a fresh graduate who's only read about it.",
      "## The path in",
      "Start by learning the workflows cold — the paperwork that runs a job and the sequence the trades follow. Then get reps running a real project, start to finish, so you build the judgment that only comes from making calls and living with them. Apply to project engineer and assistant PM roles, and lean on the story of what you've actually run. Most people who commit land a role within a few months, not years.",
    ],
  },
  {
    slug: "what-a-construction-project-manager-does-all-day",
    title: "What a construction project manager actually does all day",
    excerpt:
      "Not hard hats and blueprints on a table. The real job is a stream of decisions, emails, and deadlines that move whether you're ready or not. Here's a day in the trailer.",
    category: "The Role",
    date: "2026-06-10",
    readMinutes: 6,
    author: "Marcus Bennett",
    authorRole: "Project Executive",
    body: [
      "Ask ten people what a construction project manager does and you'll get ten vague answers. The truth is more specific — and more interesting. A PM is the hub every question routes through: the owner, the architect, the subs, accounting, and the field all need something, and it's your job to keep the whole thing moving on time and on budget.",
      "## Morning: triage",
      "The day starts in the inbox. The owner wants a ROM for an added EV-charging scope. Your switchgear vendor sent a quote with a 30-day price hold. Accounting is holding a payment over a missing lien waiver. None of these can sit. You code the invoice, price the change, and chase the waiver before the 9 a.m. coordination call.",
      "## Midday: the paperwork that is the job",
      "People imagine the PM out walking the slab. Some days, sure — but the leverage is in the documents. You issue an RFI on a grading conflict so it's on record. You review a submittal so the fabricator can hit their slot. You add change-event line items to an unapproved commitment. Every one of these protects the schedule and the margin.",
      "## Afternoon: people",
      "Then it's meetings and phone calls. The estimator flags a scope gap on steel. A sub is slow returning their buyout — you call the number in the directory and follow up in the thread. You sit in a bid review and get asked, on the spot, how you'd level two bids that aren't apples to apples. The job is relentlessly social.",
      "## The through-line",
      "By end of day you close out tasks, note what slipped, and set up tomorrow. The pattern never really changes: information comes at you faster than you can act on it, and your value is deciding what matters first. That's the muscle you can only build by doing — which is exactly why reps matter more than lectures.",
    ],
  },
  {
    slug: "construction-management-salaries-2026",
    title: "Construction management salaries in 2026: entry to executive",
    excerpt:
      "What you can realistically earn as you climb — from your first coordinator role to a VP seat — and what pushes you up the ladder faster.",
    category: "Salary",
    date: "2026-05-28",
    readMinutes: 8,
    author: "Dana Whitfield",
    authorRole: "Former Senior PM, 14 years",
    body: [
      "Compensation is one of the reasons construction management is worth a serious look — it starts solid and climbs steeply for people who deliver. Here's the honest shape of the ladder in the U.S., with the caveat that region, sector, and company size move every number.",
      "## Entry: roughly $58,000",
      "Coordinators, project engineers, and assistant project managers typically start around the high-$50Ks. This is the reps phase: you're learning buyout, submittals, RFIs, and billing on live projects. No degree is required to get here — ability and vocabulary matter more.",
      "## Mid-career: $100,000+",
      "Once you're running your own projects as a Project Manager — a few years in for people who push — total comp commonly crosses six figures. The jump comes from ownership: when the schedule and the margin are yours to protect, you're worth substantially more.",
      "## Senior and executive: $200,000–$300,000+",
      "Senior PMs, Directors of Construction, and VPs who carry a portfolio and a P&L land in the low-to-mid six figures and beyond. At this level you're managing managers and steering risk across many jobs.",
      "## What moves you up faster",
      "Three levers compound: taking on financial responsibility early, getting fluent in the tools so nothing slows you down, and building a track record of jobs that closed clean. The people who climb fastest treat every project as evidence — and they don't wait for permission to own more.",
      "Numbers here reflect typical U.S. construction management roles and are meant as a realistic guide, not a guarantee.",
    ],
  },
  {
    slug: "rfis-submittals-buyout-the-paperwork-that-runs-the-job",
    title: "RFIs, submittals, and buyout: the paperwork that runs the job",
    excerpt:
      "The three workflows that separate people who look busy from people who actually move a project. A plain-English primer.",
    category: "Skills",
    date: "2026-05-12",
    readMinutes: 9,
    author: "Rachel Nguyen",
    authorRole: "Senior Estimator",
    body: [
      "If you learn only three things before your first day in the trailer, learn these. RFIs, submittals, and buyout are the connective tissue of a construction project — get fluent in them and you can hold a real conversation with any superintendent or subcontractor.",
      "## RFIs — asking the right question, on the record",
      "A Request for Information is how the field asks the design team to resolve something the drawings don't answer: a conflict, a missing detail, an ambiguity. The skill isn't filling out the form — it's spotting the issue early and writing it so the answer actually unblocks the work. A good RFI protects the schedule; a vague one invites a useless answer.",
      "## Submittals — proving what gets installed",
      "Before a sub fabricates or orders, they submit product data, shop drawings, or samples for the architect to review against the specs. Miss a submittal and the fabricator misses their slot, and now your steel or your elevator is late. Managing the submittal log — knowing what's out, what's due, and what's holding up procurement — is quietly one of the highest-leverage things a PM does.",
      "## Buyout — turning a budget into contracts",
      "Buyout is where you take the estimate and actually award the work: soliciting, leveling, and executing subcontracts and purchase orders for every trade. The trap is the apparent low bid that has a scope gap — the number looks great until you realize connections or restripe work weren't included. Leveling bids so you're comparing the same scope is the whole game.",
      "## Why they go together",
      "These three feed each other. Buyout sets who's doing the work; submittals prove what they'll install; RFIs resolve what the documents left open. A PM who runs all three cleanly keeps procurement ahead of the schedule instead of chasing it. That's the difference between a job that flows and one that lurches.",
    ],
  },
  {
    slug: "from-the-field-to-the-trailer",
    title: "From the field to the trailer: making the jump to the office",
    excerpt:
      "Tradespeople make some of the best project managers — they already understand the work. Here's how to translate field experience into an office role.",
    category: "Career",
    date: "2026-04-30",
    readMinutes: 6,
    author: "Marcus Bennett",
    authorRole: "Project Executive",
    body: [
      "Some of the sharpest project managers started with tools in their hands. If you've spent years in the field, you already have the thing that's hardest to teach: an instinct for how buildings actually go together. The move to the trailer is mostly about adding the office half of the job.",
      "## What already transfers",
      "You know sequence. You know which trades step on each other, what a realistic install rate looks like, and when a schedule is fantasy. You can smell a scope gap. Office PMs who've never swung a hammer spend years building that instinct — you're starting with it.",
      "## What you need to add",
      "The paperwork and the money. RFIs, submittals, buyout, change orders, pay applications, and the budget — the administrative spine that turns field work into a controlled, billable project. It's learnable, and it's mostly about reps: doing the workflows enough times that they're second nature.",
      "## The credibility trap",
      "The hard part isn't the knowledge — it's proving to a hiring manager that you can run the office side, not just the work. This is where a track record helps most. Being able to say 'I ran a full project's buyout and change management, start to finish' — even in a simulated build — closes the gap between field credibility and office trust.",
      "## Make the jump deliberate",
      "Don't wait to be handed the office. Learn the tools, get reps running the paperwork, and go into interviews with a story about a job you managed end to end. Field experience plus office fluency is a rare, well-paid combination — and it's yours to build.",
    ],
  },
  {
    slug: "how-to-read-a-drawing-set",
    title: "How to read a drawing set when you've never seen one",
    excerpt:
      "Architectural, structural, MEP, civil — a construction drawing set looks like a wall of symbols until someone shows you the logic. Here's the map.",
    category: "Skills",
    date: "2026-04-15",
    readMinutes: 7,
    author: "Rachel Nguyen",
    authorRole: "Senior Estimator",
    body: [
      "The first time someone hands you a full drawing set, it's overwhelming — hundreds of sheets, dense with symbols and abbreviations. But a set is organized on a logic that never changes, and once you see it, you can find anything.",
      "## The disciplines, in order",
      "Sets are grouped by discipline and usually run in the same sequence: General (G), Civil (C), Architectural (A), Structural (S), Mechanical (M), Electrical (E), Plumbing (P), and Fire Protection (FP). Each sheet number tells you the discipline and roughly where you are — A-301 is architectural, and the 300s are typically sections. Learn the prefixes and you stop feeling lost.",
      "## Plans, elevations, sections, details",
      "Within a discipline you're looking at the same building four ways: plans (looking down), elevations (looking at a face), sections (a vertical cut), and details (a zoomed-in close-up of one condition). Cross-references stitch them together — a bubble on a plan points you to the section or detail that explains it.",
      "## Specs are the other half",
      "Drawings show location and dimension; the specifications — organized by the CSI MasterFormat divisions — tell you the quality: the products, standards, and workmanship required. A drawing says a door goes here; the spec says exactly which door. You need both to understand scope, and mismatches between them are exactly what RFIs exist to resolve.",
      "## How to actually learn it",
      "Don't try to memorize a set — use one. Chase a real question through the drawings: where does this beam land, what's the finish in this room, how does this wall meet the slab? Reading a set in service of a decision is how it finally clicks, which is why doing beats studying every time.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
