/**
 * "Integrated Project Management" track — the management layer that sits above
 * the hands-on workflow and technical tracks: what makes a project succeed,
 * how the client business case is built, stakeholder and procurement strategy,
 * leadership across the life cycle, integrated risk & value management, ethics,
 * digital construction / BIM, sustainable delivery, quality systems, and
 * structured close-out.
 *
 * Authored from "Construction Project Management: An Integrated Approach"
 * (Fewings & Henjewele, 3rd edition, Routledge 2019). Where that text uses UK
 * framing (RIBA Plan of Work, OGC Gateway, NEC, BREEAM), the lessons keep the
 * concept but add the US-equivalent framing (AIA phases, LEED, CSI) so the
 * material lands for a SiteCommand PM. This track deliberately teaches the
 * *why* and the *decision frameworks*; the sibling tracks teach the *how*.
 *
 * Client-safe; imports only types from training-lessons (no runtime cycle).
 */

import type { Lesson } from "./training-lessons";

const PRACTICE_LINK = {
  label: "Practice this in your training sandbox",
  href: "/training/practice",
};

export const MANAGEMENT_LESSONS: Lesson[] = [
  // ───────────────── Foundations of the integrated approach ─────────────────
  {
    id: "pm-integration",
    track: "foundations",
    category: "Managing the Project",
    title: "Why Construction Fragments — and What Integration Fixes",
    summary:
      "The core thesis of modern PM: construction underperforms because the team, supply chain, and client are fragmented. The PM's job is to integrate diverse interests into a common goal.",
    minutes: 8,
    keyTerms: [
      { term: "Fragmentation", definition: "The structural separation of design, construction, and the supply chain into siloed contracts and disciplines that don't share information or goals — the root cause of most construction waste and conflict." },
      { term: "Integration", definition: "Closer working relations between the project team, the supply chain, and the client so that objectives are unified toward a common goal rather than defended in silos." },
      { term: "Loosely coupled system", definition: "Dubois & Gadde's description of construction: a system whose parts are only weakly connected, which gives flexibility on site but blocks learning and innovation across projects." },
      { term: "Lean construction", definition: "A production philosophy borrowed from manufacturing that attacks waste (waiting, rework, over-processing, excess inventory) by defining reliable processes and pulling work only when the downstream trade is ready." },
    ],
    body: [
      {
        heading: "The problem the whole discipline is trying to solve",
        paragraphs: [
          "Construction is unusually wasteful compared with other industries, and most of that waste is not physical — it is the waste connected with conflict, rework, waiting, and duplicated effort. Fewings & Henjewele argue that the root cause is fragmentation: design, construction, and the supply chain are split into separate contracts, separate professions, and separate offices that guard their own interests instead of pursuing a shared goal.",
          "A great deal of construction's inefficiency is therefore a coordination failure, not a technical one. The building can be built; the problem is getting dozens of firms who meet only for this one project — and may never work together again — to behave as one team.",
        ],
      },
      {
        heading: "Why the industry stays fragmented",
        bullets: [
          "One-off teams: each project assembles a new coalition of designer, GC, and subs, so there is little accumulated trust and every project re-learns the same lessons (the industry behaves as a 'loosely coupled system').",
          "Sequential contracts: traditional procurement designs the whole building, then tenders it, then builds it — minimum overlap between the people who design and the people who know how it goes together.",
          "Adversarial risk transfer: each party protects itself by pushing risk down the chain (owner → GC → sub → supplier), which encourages defensive behavior instead of problem-solving.",
          "A master–servant culture: the client instructs, the designer specifies, the contractor obeys — information flows one way and buildability knowledge never travels back upstream.",
        ],
      },
      {
        heading: "What integration actually means",
        paragraphs: [
          "Integration is not a single contract clause — it is a way of working. The project manager's central function is to integrate diverse interests and unify objectives to achieve a common goal. That means bringing construction knowledge into design early, bringing the supply chain in before the drawings are frozen, and keeping the client's business objectives visible to the team the whole way through.",
          "The modern version of this thesis adds a wider responsibility: the team must ensure the building addresses current and future societal needs — sustainability, health and safety, and social value are now embedded inside the old cost/time/quality bargain, not bolted on afterward.",
        ],
      },
      {
        heading: "The tools integration relies on",
        bullets: [
          "Partnering & framework agreements — deliberately building trust and repeat relationships so the team is not strangers.",
          "Integrated Project Delivery (IPD) — a shared contract that ties designer, builder, and often key subs to a common risk/reward pool.",
          "Lean construction — attacking waste through reliable, pulled workflow (the Last Planner System, pull planning) rather than pushing work by schedule alone.",
          "BIM and a Common Data Environment — a single shared model and single source of truth so everyone is working from the same information (see the Digital Construction lesson).",
          "Early contractor and supply-chain involvement — putting buildability and price knowledge into the design while it can still change cheaply.",
        ],
      },
      {
        heading: "Why this matters to you as a SiteCommand PM",
        paragraphs: [
          "Every SiteCommand tool — RFIs, submittals, change events, the shared directory, linked emails — is an integration device: it exists to keep information flowing between parties who would otherwise be siloed. When you keep the RFI log moving, resolve conflicts in coordination instead of in the field, and keep the owner informed, you are doing the integrating work that this entire discipline is built around.",
          "Hold this idea as the frame for the rest of this track: success, procurement, risk, leadership, and quality are all really answers to the same question — how do you get a fragmented, one-off coalition to behave like a single team pointed at the client's goal?",
        ],
      },
    ],
    relatedLessonIds: ["pm-success", "pm-procurement-strategy", "pm-digital"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-success",
    track: "foundations",
    category: "Managing the Project",
    title: "Defining Project Success: The Time–Cost–Quality Triangle and Beyond",
    summary:
      "How the classic iron triangle expanded into six variables, why 'success' means different things to different parties, and the critical success factors that separate the jobs that deliver from the ones that don't.",
    minutes: 8,
    keyTerms: [
      { term: "Iron / time–cost–quality triangle", definition: "The classic model that a project is bounded by three competing constraints — schedule, budget, and quality/scope — and that pushing on one moves the others." },
      { term: "Six variables", definition: "PRINCE2's expansion of the triangle to time, cost, quality, scope, risk, and benefits — recognizing that risk and the client's realized benefits are constraints too." },
      { term: "Critical success factor (CSF)", definition: "A condition that must be in place for a project to succeed — e.g. a clear mission, top-management support, a competent team. Slevin & Pinto identified 10 from surveys of project managers." },
      { term: "Success criteria vs. success factors", definition: "Criteria are how you judge the outcome (was it on time, on budget, fit for purpose?); factors are the things you manage during the project that produce those outcomes." },
    ],
    body: [
      {
        heading: "The triangle still sits at the core",
        paragraphs: [
          "Every project is a negotiation between three competing pressures: time, cost, and quality (with scope riding inside quality). Fewings & Henjewele describe it as a ball inside a triangle: push the ball into one corner and you have declared a single overriding priority; push it to the middle of one side and you have a double priority — quite normal — but try to prioritize all three equally and the project becomes very hard to manage, because you have given yourself no basis for trade-off decisions.",
          "The practical value of the triangle is not the geometry — it is forcing an explicit conversation with the client about which corner matters most. A hospital wing that must open before flu season is time-driven; a signature lobby is quality-driven; a spec warehouse is cost-driven. The PM who has not pinned this down will make trade-offs the client disagrees with.",
        ],
      },
      {
        heading: "The triangle expanded: six variables",
        paragraphs: [
          "The modern frameworks recognize that three variables are not enough. PRINCE2 works with six: time, cost, quality, scope, risk, and benefits. Adding scope makes explicit that 'more building' is a lever; adding risk makes explicit that certainty has value; and adding benefits shifts the definition of success from 'we finished the building' to 'the client got the outcome they were paying for.'",
          "This is the integrated-approach move: sustainability, health & safety, ethics, and social responsibility are now embedded inside the triangle rather than treated as constraints outside it. A job that came in on time and budget but hurt someone, or produced an unsustainable building the client can't afford to operate, has not succeeded.",
        ],
      },
      {
        heading: "Success is in the eye of the beholder",
        bullets: [
          "The client judges success by benefits realized — did the building do what the business case promised?",
          "The contractor judges success by margin and reputation — did we make money and would this client hire us again?",
          "The designer judges success by fitness and aesthetics — does it work and does it reflect well on the practice?",
          "The end user judges success by whether the space is usable, comfortable, and safe day to day.",
          "These do not automatically align. Part of integration is surfacing the different definitions early so the team is optimizing the same thing.",
        ],
      },
      {
        heading: "Critical success factors",
        paragraphs: [
          "Slevin & Pinto surveyed project managers and identified ten factors that consistently predict success. They cluster into a few themes that every PM can act on:",
        ],
        ordered: [
          "A clear mission — everyone can state the project's goal and priorities.",
          "Top-management / client support — the sponsor is engaged and clears roadblocks.",
          "A realistic schedule and plan — with the detail to actually control against.",
          "Client consultation — the client's needs are heard and fed back throughout, not just at the brief.",
          "A competent, well-selected project team.",
          "The technical capability to do the work.",
          "Client acceptance — actively selling the solution, not assuming it will be welcomed.",
          "Monitoring and feedback — measuring progress against the plan and acting on the variance.",
          "Clear communication channels across the team and stakeholders.",
          "Troubleshooting — the ability to handle the crises and deviations that every project throws up.",
        ],
      },
      {
        heading: "For the SiteCommand PM",
        paragraphs: [
          "Notice how many CSFs are communication and monitoring — the exact things SiteCommand's daily logs, look-aheads, meeting minutes, and dashboards are built to support. Success is less about heroics and more about keeping a clear plan, measuring against it, and closing the feedback loop with the client and the field before small variances become claims.",
        ],
      },
      {
        heading: "Case in point: King Shaka International Airport",
        paragraphs: [
          "A $1 billion greenfield airport in South Africa, built to open for the 2010 FIFA World Cup. The priorities were explicitly time and quality; budget was a secondary consideration — a textbook single-corner push on the triangle. The PM built the whole team around that priority: people who could hit urgent deadlines and produce accurate documentation right the first time, coordinated across a multinational team through an online intranet and 'informal clusters' of design, construction, and cost managers that deliberately built relationships across disciplines and cultures.",
          "The lesson's warning also shows up: an external stakeholder — the Department of Environmental Affairs — delayed the project substantially, and the team failed to agree an acceptable design within the 77 days the contract stipulated. Even a time-driven job with a clear priority is only as fast as its most powerful external stakeholder allows.",
        ],
      },
    ],
    relatedLessonIds: ["pm-integration", "pm-business-case", "pm-risk-value"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-ethics",
    track: "foundations",
    category: "People & Leadership",
    title: "Ethical Project Leadership: The PM in the Middle",
    summary:
      "The PM sits between client, team, community, and profession — accountable to all of them. What the professional codes actually require, and the everyday ethical traps in construction.",
    minutes: 7,
    keyTerms: [
      { term: "Code of conduct", definition: "A professional body's stated standard of behavior (PMI, RICS, RAE, CIOB) that a member agrees to uphold — covering competence, honesty, confidentiality, and public good." },
      { term: "Accountability", definition: "Being answerable for your decisions to employers, clients, the wider community, and the reputation of the profession — the pivot of ethical leadership per Ireland et al." },
      { term: "Impartiality", definition: "Making fair judgments even when a party you depend on for work would prefer a different answer — a recurring tension for a PM administering a contract." },
      { term: "Social value", definition: "The wider benefit a project delivers to the community — local employment, apprenticeships, environmental care — increasingly a formal client and public-sector requirement." },
    ],
    body: [
      {
        heading: "Why ethics is a leadership topic, not a compliance one",
        paragraphs: [
          "The PMI puts it bluntly: 'Leadership is absolutely dependent on ethical choices.' Ethical choices diminish risk, advance positive results, increase trust, and build the reputation that wins the next job. A team takes its cues from how the PM behaves under pressure — if the leader cuts a corner, the corner-cutting becomes the culture.",
          "The PMI grounds ethical conduct in four drivers: responsibility, respect, fairness, and honesty. The Royal Academy of Engineering frames it similarly: honesty and integrity; respect for life, law, the environment, and the public good; accuracy and rigour; and leadership and communication.",
        ],
      },
      {
        heading: "The PM is positioned in the middle",
        paragraphs: [
          "Uniquely, the project manager represents the interests of all parties at once. You are accountable to your employer and the client, but also to the wider community and the standing of the profession. That means holding several duties in tension: keep client confidences and stay impartial when administering the contract; make fair judgments; be adequately researched, knowledgeable, and experienced; be aware of wider stakeholders; and balance competing requirements honestly.",
          "It also means being able to manage disputes, compete fairly for work, respect social diversity, and communicate transparently about the strengths and weaknesses of a solution rather than overselling it.",
        ],
      },
      {
        heading: "The everyday ethical traps in construction",
        bullets: [
          "Pricing games — headline low bids with hidden costs, or 'lubricating' payments to win or smooth work.",
          "Quality short cuts that are invisible once covered — the sub who knows the inspector won't see it.",
          "Poor labor practice — unpaid apprentices, excessive hours, using agencies to dodge holiday pay and pension duties.",
          "Squeezing the supply chain — late payment to and bullying of subcontractors to protect the GC's cash position.",
          "Environmental corner-cutting — inappropriate material sourcing and waste disposal.",
          "Shoddy design or execution that frustrates users and wears out early — an ethical failure to the end user and community even if it was contractually 'compliant.'",
        ],
      },
      {
        heading: "Doing it in practice",
        paragraphs: [
          "Ethical leadership on a live job is mostly small, repeated choices: paying subs on time, documenting decisions so nobody can be scapegoated later, flagging a problem you could have buried, giving the client the honest schedule rather than the comfortable one. SiteCommand's audit trails — change history, RFI records, lien-waiver tracking, held-payment flags — exist partly to make the honest path the easy path and to leave a record that protects the people who did the right thing.",
        ],
      },
      {
        heading: "Case in point: the Considerate Constructor Scheme",
        paragraphs: [
          "The book's ethical-contracting example is the UK's Considerate Constructor Scheme (CCS) — a voluntary scheme that awards recognition for engaging community stakeholders, protecting worker and public health and safety, and delivering site work more sustainably. It caught on with most urban contractors because ethical behavior paid off commercially: it reduced conflict with neighbors over construction nuisance, enhanced the reputation of both public and private clients, and helped in value-driven tenders.",
          "The counter-example in the same chapter is the UK Office of Fair Trading's investigation into cover pricing, and a Malaysian study linking unethical procurement and lax supervision to poor construction quality. The pairing is the point: ethics is not charity — good conduct builds the trust and reputation that win work, and unethical short cuts show up later as conflict, investigation, and defects.",
        ],
      },
    ],
    relatedLessonIds: ["pm-leadership", "pm-stakeholders", "pf-industry-ethics"],
    links: [PRACTICE_LINK],
  },

  // ───────────────────── Front end: business case & value ─────────────────────
  {
    id: "pm-business-case",
    track: "precon",
    category: "Feasibility & Zoning",
    title: "Building the Client Business Case & the Gateway Framework",
    summary:
      "Projects fail in the brief long before they fail on site. How a business case is built, tested, and defended — and why the Gateway/stage-gate model exists to kill bad projects early.",
    minutes: 8,
    keyTerms: [
      { term: "Business case", definition: "The document that justifies the project: the problem, the options considered, the recommended option, its costs and benefits, and the risks — the basis on which the client decides to invest." },
      { term: "Strategic brief", definition: "The client's high-level statement of need and objectives, before design — the thing the whole project must ultimately be measured against." },
      { term: "Gateway / stage-gate", definition: "A review point between life-cycle stages where an independent panel decides whether the project is fit to proceed, be reworked, or be stopped — the OGC Gateway process and RIBA/AIA stage boundaries." },
      { term: "Cost–benefit analysis (CBA)", definition: "A public-sector appraisal technique that monetizes the wider social costs and benefits of a project, not just its private financial return." },
    ],
    body: [
      {
        heading: "Success or failure is decided at the front end",
        paragraphs: [
          "The cheapest place to change a project is in the brief; the most expensive is on site. Yet the front end — defining the right problem and testing whether the project should happen at all — gets the least management attention. Fewings & Henjewele argue for business–project integration: the project must stay tied to the business need that justified it, or it drifts into building the wrong thing well.",
          "A business case answers a simple question the client's board will ask: why should we spend this money, on this option, now, given the risks? If the PM can't articulate that, the project has no anchor for later trade-off decisions.",
        ],
      },
      {
        heading: "What a business case contains",
        ordered: [
          "The strategic need — the business problem or opportunity, tied to the client's objectives.",
          "The options — including the 'do nothing' and 'do minimum' baselines, so the recommended option is judged against real alternatives.",
          "Appraisal of each option — cost, benefit, and risk (see the feasibility and appraisal techniques in the Preconstruction track).",
          "The recommended option with its whole-life cost — capital plus the cost to operate and maintain the asset, not just to build it.",
          "The risks and the client's constraints — the fixed points (a hard opening date, a funding cap, a planning limit) the project must live within.",
          "The benefits and how they'll be measured — so success can actually be judged after handover.",
        ],
      },
      {
        heading: "Why the Gateway / stage-gate model exists",
        paragraphs: [
          "Left alone, projects build momentum: money spent and reputations invested make it psychologically hard to stop, even when the case has collapsed. The Gateway model (and the stage boundaries in the RIBA Plan of Work or the AIA design phases) inserts deliberate decision points between stages where someone independent asks 'should this continue?' The honest answers are proceed, rework, or stop — and a good process is willing to stop.",
          "Each gate also confirms the project is still delivering value and is still affordable before the client commits the next, larger tranche of spend. This is where risk is re-assessed and the business case is revisited, not just the design reviewed.",
        ],
      },
      {
        heading: "Managing change in the business case",
        paragraphs: [
          "The business case is not frozen at approval. Markets move, budgets tighten, the client's strategy shifts. Managing change in the business case means keeping the justification current — when a scope change is proposed on site, the real question is whether it still serves the business need and stays inside the client's constraints, not just whether it's technically feasible.",
          "For the SiteCommand PM, this is the mindset behind change events and the owner's approval workflow: every change is implicitly a small edit to the business case, and the client is entitled to weigh it against their original objectives before you build it.",
        ],
      },
      {
        heading: "Case in point: the London 2012 Olympic legacy",
        paragraphs: [
          "The business case for London 2012 had a hard problem: how do you justify enormous spend for facilities used intensely for only a few weeks? The answer was legacy — the case was built on reusing and reconfiguring the assets afterward, with a 90,000-seat stadium designed from the outset to be partially dismantled into a smaller national athletics stadium for East London's residents.",
          "It also shows the business case being actively managed after approval: the reduced stadium generated insufficient revenue, so it was leased to a football club that still allowed athletics out of season — preserving the public legacy. Notably, maintaining legacy was held as the priority over revenue, and negotiations capped the price below the site's economic value to fund other public projects. The justification, not just the design, was steered all the way through.",
        ],
      },
    ],
    relatedLessonIds: ["pm-stakeholders", "pm-success", "fo-constructability-ve"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-stakeholders",
    track: "foundations",
    category: "People & Leadership",
    title: "Stakeholder Mapping & Management",
    summary:
      "Every project has more interested parties than appear on the org chart. How to identify them, map them by power and interest, and manage each group so stakeholder conflict doesn't derail the job.",
    minutes: 7,
    keyTerms: [
      { term: "Stakeholder", definition: "Any individual or group who can affect, or is affected by, the project — from the client and end users to neighbors, regulators, and pressure groups." },
      { term: "Internal vs. external stakeholders", definition: "Internal: parties inside the project coalition (client, team, funders, supply chain). External: parties outside it who still have influence (community, regulators, media, environmental groups)." },
      { term: "Power–interest matrix", definition: "A 2×2 grid that plots stakeholders by how much power they hold and how much interest they have, giving four management strategies (manage closely, keep satisfied, keep informed, monitor)." },
      { term: "Stakeholder conflict", definition: "When stakeholders want incompatible things (a neighbor wants no construction traffic; the client wants fast delivery) — a predictable source of delay and cost if not managed early." },
    ],
    body: [
      {
        heading: "Why stakeholders are a management problem, not a courtesy",
        paragraphs: [
          "Projects don't only fail on cost and schedule — they fail because a group with enough influence to stop the work was ignored until it did. A planning objection, a community campaign, an internal department that never bought in, a regulator surprised late: each can cost more than any technical problem. Stakeholder management is the discipline of anticipating those parties and engaging them before they become obstacles.",
        ],
      },
      {
        heading: "Identify: internal and external",
        bullets: [
          "Internal — the client and its board, funders, the design and construction team, the supply chain: the coalition delivering the project.",
          "External — end users and occupants, neighbors and the local community, planning and building authorities, environmental and heritage groups, utilities, insurers, and sometimes the press.",
          "Don't stop at the obvious names. The most dangerous stakeholder is the one nobody put on the list — the internal department that gets relocated, the neighbor whose access you'll block, the future operator who inherits the building.",
        ],
      },
      {
        heading: "Map: power and interest",
        paragraphs: [
          "Once identified, plot each stakeholder on a power–interest matrix and let the quadrant set the strategy:",
        ],
        ordered: [
          "High power, high interest — manage closely. These parties can make or break the project and care deeply (the client, a key regulator). Involve them in decisions and keep them engaged.",
          "High power, low interest — keep satisfied. They can act if provoked but aren't watching daily (a senior sponsor, a major funder). Give them enough to stay comfortable; don't overload them.",
          "Low power, high interest — keep informed. They care a lot but can't move the needle alone (end users, community groups). Good information keeps them allies rather than campaigners.",
          "Low power, low interest — monitor. Minimal effort, but re-check periodically, because interest and power can both rise as a project becomes visible.",
        ],
      },
      {
        heading: "Manage: engagement, not broadcast",
        paragraphs: [
          "Stakeholder management is a two-way relationship, not a newsletter. Value-management and user-group meetings, early consultation, and honest handling of objections turn potential opponents into contributors. A stakeholder who was consulted and heard — even if they didn't get everything they wanted — is far less likely to escalate than one who was informed of a decision after the fact.",
          "Stakeholders also change through the life cycle: a neighbor is low-interest during design and high-interest the day the piles start driving. Revisit the map at each stage rather than treating it as a one-time exercise. In SiteCommand terms, the project directory, the RFI/submittal distribution lists, and the owner-facing reporting are all stakeholder-management tools — use them to keep the right parties informed at the right depth.",
        ],
      },
    ],
    relatedLessonIds: ["pm-business-case", "pm-ethics", "pm-leadership"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Procurement & delivery strategy ───────────────────────
  {
    id: "pm-procurement-strategy",
    track: "precon",
    category: "Budgeting & Procurement",
    title: "Choosing a Procurement Route",
    summary:
      "Before you pick a contract you pick a procurement route — who designs, who builds, in what order, and who carries which risk. The route decides how integrated (or fragmented) the whole project will be.",
    minutes: 9,
    keyTerms: [
      { term: "Procurement route", definition: "The overall structure of who is appointed, in what sequence, and how design and construction responsibility is divided — traditional, design-and-build, management, or integrated." },
      { term: "Traditional (design–bid–build)", definition: "The client's designer completes the design, then the work is competitively tendered and a contractor builds it. Maximum design control, minimum overlap, longest overall duration." },
      { term: "Design and build (D&B)", definition: "A single contractor takes responsibility for both design and construction — single-point responsibility and cost certainty, at the cost of some client design control." },
      { term: "Management contracting / construction management", definition: "The construction manager is appointed early for a fee to manage trade packages that overlap with ongoing design — fast, flexible, but with less early cost certainty." },
      { term: "Two-stage tender", definition: "The contractor is selected early on qualifications and preliminaries (stage 1), then the price is firmed up collaboratively as design completes (stage 2) — a way to get contractor input without losing competition." },
    ],
    body: [
      {
        heading: "The route is a strategic choice, not a form to fill in",
        paragraphs: [
          "Before anyone chooses a contract form, the client (advised by the PM) must decide the procurement route: who appoints the contractor, when, and how design and construction responsibility is split. This single decision drives how long the project takes, how much cost certainty the client gets, how much design control they keep, and — crucially for this track — how integrated or fragmented the team will be.",
          "There is no universally 'best' route. The right answer depends on the client's priorities from the time–cost–quality triangle, their appetite for risk, how well-defined the project is, and how much design control they want to retain.",
        ],
      },
      {
        heading: "The main routes and their trade-offs",
        bullets: [
          "Traditional (design–bid–build): the designer completes the design, then it's tendered, then built. Gives the client the most control over design and a clear price to bid against — but has minimum overlap between design and construction, so it takes longest and buildability knowledge never reaches the design. This is the classic 'fragmented' route.",
          "Design and build (D&B): one contractor owns both design and construction. Single-point responsibility (one throat to choke), better cost certainty, and design/construction can overlap — but the client gives up direct control of the design and must define what they want up front through the employer's requirements.",
          "Management contracting & construction management: a manager is appointed early for a fee and lets trade packages while design continues. Fastest to start and very flexible for complex or uncertain projects — but the client carries more risk and gets cost certainty later, package by package.",
          "Integrated / collaborative (partnering, IPD, frameworks): the team is deliberately bound together with shared risk/reward. Highest integration and best environment for lean working — but requires trust, the right client, and contracts built for collaboration (e.g. NEC-style transparent pricing).",
        ],
      },
      {
        heading: "The tendering choices inside the route",
        paragraphs: [
          "Within a route, several further decisions shape competition and collaboration:",
        ],
        ordered: [
          "Single vs. two-stage: single-stage prices a complete design; two-stage brings the contractor in early on preliminaries, then firms the price up as design completes — trading a little competition for a lot of buildability input.",
          "Open vs. selective: open invites anyone qualified; selective pre-qualifies a shortlist, saving abortive bidding cost and raising bid quality.",
          "Competitive vs. negotiated: competition drives price; negotiation (often with a framework partner) drives speed, relationship, and repeat learning.",
          "Framework agreements: pre-agreed terms with a panel of suppliers for repeat work — the client trades one-off lowest price for continuity, trust, and the learning-curve savings of a team that has worked together before.",
        ],
      },
      {
        heading: "Public–private partnerships (PPP/PFI/PF2)",
        paragraphs: [
          "For large public infrastructure, the client may transfer not just construction but financing and long-term operation to a private consortium, which is repaid over decades from availability or usage. These models can deliver whole-life integration (the party that builds it also operates it, so it has an incentive to build it well) — but they are complex, and value-for-money depends heavily on how risk is genuinely transferred rather than just named in the contract.",
        ],
      },
      {
        heading: "For the SiteCommand PM",
        paragraphs: [
          "You will usually inherit the route rather than choose it — but understanding it explains everything about how your project behaves. On a D&B job the design questions come to you, not the owner's architect; on a traditional job you're administering someone else's design and RFIs flow to the design team; on a CM job you're buying out packages while design is still moving. Knowing the route tells you where the risk sits, who answers questions, and why the change-order pressure lands where it does.",
        ],
      },
      {
        heading: "Case in point: NEC3 contract flexibility in Hong Kong",
        paragraphs: [
          "A public client delivered a £45 million new-town infrastructure package (community hall, sports centre, transport interchange, roads, drainage, utilities) on an NEC3 (ECC) Option C contract over three and a half years. Because the client wanted mutual co-operation to fast-track site formation, they invested up front: a consultant ran training workshops so the team understood NEC's early-warning, risk-reduction, compensation-event, and open-book mechanisms.",
          "The route paid off when utility diversions ran slow and the contractor spotted a potential clash between a proposed storm drain and existing utilities. The NEC 'spirit of co-operation' let the contractor raise an early warning; a joint risk-reduction meeting then put trial trenches and a design review in place before the conflict became a claim. The procurement route — not heroics — created the behavior that caught the problem early.",
        ],
      },
    ],
    relatedLessonIds: ["com-delivery", "pm-risk-value", "wf-buyout"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Organisation & leadership ───────────────────────
  {
    id: "pm-leadership",
    track: "foundations",
    category: "People & Leadership",
    title: "Leadership Styles Across the Project Life Cycle",
    summary:
      "There is no single right leadership style — the effective PM flexes from participative in design to directive on site. The trait, style, situational, and contingency theories, made practical.",
    minutes: 8,
    keyTerms: [
      { term: "Trait theory", definition: "The earliest leadership theory — that leaders are born with certain traits. Largely superseded, but a reminder that credibility and presence still matter." },
      { term: "Style theory", definition: "Groups leadership into behavioral categories — autocratic (leader decides), participative (shared decision), delegative — treated as personal preferences." },
      { term: "Situational leadership (Hersey & Blanchard)", definition: "Style should be adjusted to the team's competence and commitment and to the task — directing, coaching, supporting, or delegating as appropriate." },
      { term: "Contingency theory (Fiedler)", definition: "Leader effectiveness depends on the interaction between the leader's style and how much control the situation gives them — there is no one best style independent of context." },
    ],
    body: [
      {
        heading: "Why 'what kind of leader should I be?' has no single answer",
        paragraphs: [
          "Leadership theory evolved from asking what leaders *are* (traits), to what they *do* (styles), to what the *situation* demands (situational and contingency). For a construction PM, the last two matter most, because a construction project deliberately changes character as it moves through its life cycle — and the leadership it needs changes with it.",
        ],
      },
      {
        heading: "The style spectrum",
        bullets: [
          "Autocratic — the leader decides and expects the team to follow. Fast and clear; poor for buy-in and creativity.",
          "Participative — the leader shares decision-making. Slower, but builds ownership and surfaces knowledge the leader doesn't have.",
          "Delegative — the leader hands decisions to capable team members and stays out of the detail. Powerful with a strong, trusted team; dangerous with a weak or new one.",
        ],
      },
      {
        heading: "Situational leadership: flex to the team and the task",
        paragraphs: [
          "Hersey & Blanchard's insight is that the right style depends on the follower's readiness and the task. A new sub who's never done this detail needs directing; an experienced foreman on familiar work needs delegating; someone capable but unsure needs coaching or supporting. The skill is reading which one is in front of you and adjusting — not applying one favorite style to everyone.",
          "Fewings & Henjewele note this suits construction especially well, because construction is full of variety and uncertainty and demands a flexible approach. The same PM should not lead a design charrette and a critical concrete pour the same way.",
        ],
      },
      {
        heading: "Style changes through the life cycle",
        paragraphs: [
          "A key, practical point: leadership style often shifts across the project. In the design and planning stages, where the work is loosely structured and depends on creativity and buy-in, a participative style tends to work best. In the construction stage, where tasks are tightly structured, sequencing is critical, and a missed pour or crane pick can't be undone, a more directive style is appropriate.",
          "The modern twist is that collaborative contracts and integrated online working push toward relationship-building and participation even on site — so the swing toward directive leadership is less absolute than it once was. The best PMs hold both modes and switch deliberately rather than by temperament.",
        ],
      },
      {
        heading: "Contingency: match style to how much control you have",
        paragraphs: [
          "Fiedler adds that effectiveness depends on how much control the situation gives you — your relationship with the team, how structured the task is, and your formal authority. A PM with strong relationships, a well-defined task, and clear authority can lead very differently from one parachuted into a troubled job with none of those. Part of leadership is honestly reading your own situational control and choosing an approach that fits it, rather than the approach you wish worked.",
        ],
      },
    ],
    relatedLessonIds: ["pm-ethics", "pm-stakeholders", "pf-leadership"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Risk, value & control ───────────────────────
  {
    id: "pm-risk-value",
    track: "foundations",
    category: "Managing the Project",
    title: "Integrated Risk & Value Management",
    summary:
      "Risk and value are two sides of one coin: value management asks 'are we getting the most function for the money?' and risk management asks 'what could stop us?' How to run both as disciplined, continuous processes.",
    minutes: 9,
    keyTerms: [
      { term: "Risk", definition: "An uncertain event that, if it occurs, affects the project's objectives — negatively (a threat) or positively (an opportunity)." },
      { term: "Risk register", definition: "The living document that lists each identified risk with its likelihood, impact, owner, and planned response — the backbone of the risk process." },
      { term: "Risk response strategies", definition: "The four moves for a threat: avoid (change the plan to remove it), transfer (insure or contract it to another party), mitigate/reduce (lower its likelihood or impact), or accept (carry it, with contingency)." },
      { term: "Value management (VM)", definition: "A structured process to maximize the ratio of function to cost — deliver the client's required functions for the least whole-life cost, without cutting the function itself (distinct from mere cost-cutting)." },
      { term: "Risk allocation", definition: "The principle that each risk should sit with the party best able to control it — mis-allocating risk (dumping it on a party who can't manage it) just raises price and breeds disputes." },
    ],
    body: [
      {
        heading: "Two questions, one process",
        paragraphs: [
          "Value management asks: are we getting the most function for the money? Risk management asks: what could stop us, and what will we do about it? Fewings & Henjewele treat them together because they run on the same rhythm — identify, analyze, respond, review — and because the biggest value decisions and the biggest risks usually sit in the same place: the front end, where changes are still cheap.",
        ],
      },
      {
        heading: "The risk management cycle",
        ordered: [
          "Identify — brainstorm, use checklists and prior-project lessons, and run structured techniques (e.g. Delphi) so the team surfaces concerns openly rather than hiding them. Capture each on the risk register.",
          "Analyze — assess each risk's likelihood and impact. Qualitative first (high/medium/low, a probability–impact grid); quantitative (expected monetary value, Monte Carlo on cost/schedule) where the stakes justify it.",
          "Respond — choose avoid, transfer, mitigate, or accept for each significant risk, assign an owner, and set aside contingency for the accepted ones.",
          "Review — risk is not a one-time workshop. Re-run the register at each stage; risks close out, new ones appear, and probabilities change as the project reveals itself.",
        ],
      },
      {
        heading: "Allocate risk to the party who can control it",
        paragraphs: [
          "The single most important principle in construction risk is allocation: a risk should be carried by whoever is best placed to manage it. When clients or GCs simply push risk down the chain — onto a sub who can't influence it, or a supplier who can only price it — the risk doesn't disappear. It comes back as a higher price (the party prices in a contingency you can't see), defensive behavior (withholding payment, extra insurance), or a dispute when it materializes.",
          "Well-allocated risk is a hallmark of the integrated, collaborative routes: partnering and IPD deliberately share risk between employer and contractor and reward the team for managing it down, rather than each party trying to offload it onto the next. Fewings & Henjewele cite fair risk allocation as one of the concrete benefits partnering delivers — alongside faster conflict resolution, cost savings, better quality, and more trust.",
        ],
      },
      {
        heading: "Value management ≠ cost-cutting",
        paragraphs: [
          "The critical distinction: cost-cutting removes cost (and often function with it); value management removes cost *without* removing the function the client needs — or adds function for the same cost. A VM study asks, for each element, 'what function does this perform, and is there a way to deliver that function for less whole-life cost?' The answer might be a different material, a simpler detail, or eliminating a requirement that no longer serves the business case.",
          "Because VM is about function and whole-life cost, it belongs at the front end and needs the client, designer, and builder in the room together — another place where integration pays off. Done late, as a panic response to a bid over budget, it degrades into value *engineering*-as-cost-cutting and usually damages the project.",
        ],
      },
      {
        heading: "Control: closing the loop",
        paragraphs: [
          "Risk and value plans are worthless without control — measuring what actually happens against the plan and acting on the variance. The classic toolkit is earned value management (comparing budgeted, actual, and earned cost/progress), elemental cost control, and a clear work-breakdown structure tying tasks to responsibility. The point is early warning: the sooner a variance is visible, the cheaper it is to correct, which is exactly what SiteCommand's budget health, committed-cost, and look-ahead views are built to give you.",
        ],
      },
      {
        heading: "Case in point: Heathrow Terminal 5's risk-sharing contract",
        paragraphs: [
          "The £4.2 billion Terminal 5 project attacked the exact failure this lesson warns about — pricing for risk that gets passed down the supply chain. BAA's innovative agreement had contractors work transparently on packages up to £200 million: reveal all costs open-book, ensure the risks they took were adequately covered, and demonstrate commitment, trust, and teamwork. In return, BAA agreed to carry any residual or excess risk itself, where the cause could be proven by evidence.",
          "This took the confrontation out of contracting by managing risk at its cause rather than transferring it, and — critically — it applied to all tiers of the supply chain so risk could not simply be pushed down. It is the clearest illustration of the lesson's core principle: allocate risk to the party best able to control it, and stop the price-padding and defensiveness that mis-allocation breeds.",
        ],
      },
    ],
    relatedLessonIds: ["wf-risk", "wf-budget", "fo-constructability-ve"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-quality",
    track: "foundations",
    category: "Managing the Project",
    title: "Quality Management & Customer Care",
    summary:
      "Quality isn't just catching defects — it's a system. QA vs QC, Total Quality Management, and why the client's *perception* of quality (customer care) matters as much as the technical spec.",
    minutes: 7,
    keyTerms: [
      { term: "Quality assurance (QA)", definition: "The system and processes put in place to prevent defects — procedures, checklists, approved methods. Proactive: build it right the first time." },
      { term: "Quality control (QC)", definition: "The inspection and testing that checks the work actually meets the standard — mock-ups, tests, inspections, sign-offs. Reactive: catch what slipped through." },
      { term: "Total Quality Management (TQM)", definition: "A whole-organization philosophy of continuous improvement and customer focus, where quality is everyone's responsibility, not a separate department's." },
      { term: "Customer care", definition: "Managing the client's experience and perception — communication, responsiveness, and handling of defects — which shapes satisfaction as much as the technical quality does." },
    ],
    body: [
      {
        heading: "Quality is a system, not an inspection",
        paragraphs: [
          "The amateur view of quality is 'the inspector catches the bad work.' The professional view is that inspection alone is too late and too expensive — by the time a defect is found, the cost of rework (and often of tearing out covered work) is already sunk. Real quality management builds the work right the first time through a *system*, and uses inspection to verify, not to rescue.",
        ],
      },
      {
        heading: "QA vs QC: prevention vs. detection",
        bullets: [
          "Quality assurance (QA) is the preventive half: approved methods and materials, submittals reviewed before purchase, mock-ups approved before production, competent crews, and clear procedures. It stops defects from being created.",
          "Quality control (QC) is the detection half: inspections, tests, and sign-offs that confirm the work meets the standard — and hold points that stop the next trade from covering work before it's checked.",
          "You need both. QA without QC is trust without verification; QC without QA is catching failures you could have prevented.",
        ],
      },
      {
        heading: "Total Quality Management",
        paragraphs: [
          "TQM extends quality from a checking activity to an organizational philosophy: continuous improvement, customer focus, and the principle that quality is everyone's job. On a project, that looks like the crew that flags its own error, the sub that proposes a better detail, and a culture that treats a defect as a process problem to fix rather than a person to blame. It ties directly back to the integration theme — quality improves fastest when the whole chain owns it, not when one QC manager polices it.",
        ],
      },
      {
        heading: "Customer care: the perception half of quality",
        paragraphs: [
          "Fewings & Henjewele pair quality with customer care deliberately. A client's satisfaction is driven not only by the technical quality of the building but by their *experience* of getting it — whether they were kept informed, whether problems were handled honestly and fast, whether defects at handover were closed out promptly. A technically excellent building delivered by a team that was unresponsive and defensive can leave a dissatisfied client; a good building delivered by a team that communicated well and fixed issues gracefully wins the repeat work.",
          "This is where quality meets the closeout and warranty period. The way defects are handled after handover is, to the client, the final and most memorable expression of your quality — so treat the punch list and warranty callbacks as customer care, not as an afterthought.",
        ],
      },
    ],
    relatedLessonIds: ["wf-quality", "pm-closeout", "tech-testing-cx"],
    links: [PRACTICE_LINK],
  },

  // ─────────────────────── Modern & future practice ───────────────────────
  {
    id: "pm-digital",
    track: "precon",
    category: "Design & Engineering",
    title: "Digital Construction & BIM",
    summary:
      "BIM is not 3D drawing — it's a shared, multi-dimensional database that becomes the single source of truth for a project. The maturity levels, the Common Data Environment, and how 4D/5D change the PM's job.",
    minutes: 8,
    keyTerms: [
      { term: "BIM (Building Information Modelling)", definition: "An object-oriented database with multiple dimensions that models the building's 3D geometry along with time, cost, quantities, geographic information, and component properties — a data model, not just a drawing." },
      { term: "Common Data Environment (CDE)", definition: "The single, shared source of information for a project where all the model and document data lives, with controlled status (work-in-progress, shared, published, archived) so everyone works from the same current truth." },
      { term: "4D / 5D", definition: "4D links the model to the schedule (time), so you can simulate the build sequence; 5D adds cost, so quantities and prices update as the model changes." },
      { term: "Clash detection", definition: "Automatically finding where model elements from different disciplines occupy the same space (a duct through a beam) before it's built — the single most tangible BIM payoff for a PM." },
      { term: "Digital twin", definition: "A live digital replica of the built asset, fed by sensor data, used to operate and maintain the building after handover — BIM extended into the operational life of the asset." },
    ],
    body: [
      {
        heading: "BIM is a database, not a drawing style",
        paragraphs: [
          "The most common misunderstanding is that BIM means '3D CAD.' Fewings & Henjewele define it precisely: BIM is an object-oriented database with multiple dimensions that models 3D objects while carrying time, cost, quantities, building geometry, geographic information, and component properties. The geometry is just one view; the value is that every object *knows* what it is, so a query — how many fire dampers, what's the U-value of this wall, when does this element get installed — has an answer.",
          "That shift from drawing to data is what makes BIM an integration technology. When designer, contractor, and subs all model into a shared federated model, the model becomes the single source of truth that fragmentation normally destroys.",
        ],
      },
      {
        heading: "The Common Data Environment",
        paragraphs: [
          "BIM only delivers integration if everyone draws from one place. The Common Data Environment (CDE) is that place — the shared repository where model and document information lives, with a controlled status workflow (work-in-progress → shared → published → archived) so people can tell current, coordinated information from someone's draft. Without a disciplined CDE, BIM degenerates into competing private models and the old fragmentation returns in digital form.",
        ],
      },
      {
        heading: "The extra dimensions: 4D and 5D",
        bullets: [
          "3D — the coordinated geometry across disciplines (the basis for clash detection).",
          "4D — geometry linked to the schedule, so you can play the build sequence as an animation, test the logistics, and spot sequencing clashes (not just spatial ones) before the field hits them.",
          "5D — geometry linked to cost and quantities, so a design change updates the take-off and the estimate automatically, tightening the value-management loop.",
          "Further dimensions (sustainability, facilities data) extend the model into operation.",
        ],
      },
      {
        heading: "Clash detection — the payoff you can feel",
        paragraphs: [
          "The most tangible day-one benefit is clash detection: the software finds where a duct runs through a beam, or a sprinkler main through a cable tray, in the model — where the fix is a designer moving a line — instead of in the field, where the fix is an RFI, a delay, and a change order. A well-run clash-coordination process turns a large fraction of what used to be field RFIs into resolved model issues before anyone mobilizes.",
        ],
      },
      {
        heading: "What it changes for the PM — and where it's going",
        paragraphs: [
          "BIM pulls effort and problem-solving earlier in the project (more coordination up front, fewer surprises in the field) and demands new competencies: managing the CDE, running clash coordination, and reading the model as fluently as the drawings. The book is candid that digital technologies — BIM, and increasingly AI and digital twins — will change the PM's role, opening avenues to test designs, manufacture off-site, and communicate more directly. What they will never remove is the PM's responsibility to integrate the team; the tools make integration possible, but people still have to do it.",
        ],
      },
    ],
    relatedLessonIds: ["fo-bim", "pm-integration", "tech-mep-coordination"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-sustainability",
    track: "foundations",
    category: "Managing the Project",
    title: "Sustainable Delivery of Construction Projects",
    summary:
      "Buildings are major energy users and carbon emitters — sustainability is now embedded inside the client's objectives, not a nice-to-have. Whole-life thinking, the rating systems, and where sustainable choices actually get made.",
    minutes: 7,
    keyTerms: [
      { term: "Whole-life / life-cycle cost", definition: "The total cost of an asset across its life — capital cost plus operating, energy, maintenance, and end-of-life costs. Sustainable choices often cost more up front and far less over the life." },
      { term: "BREEAM / LEED", definition: "Building sustainability rating systems (BREEAM in the UK, LEED in the US) that award points across energy, water, materials, and site categories to certify a building's environmental performance." },
      { term: "Embodied vs. operational carbon", definition: "Embodied carbon is emitted making and transporting the materials; operational carbon is emitted running the building. Reducing both is the target of sustainable design." },
      { term: "Cradle-to-cradle", definition: "A design philosophy where materials are chosen so they can be fully recovered and reused at end of life, rather than sent to landfill (cradle-to-grave)." },
    ],
    body: [
      {
        heading: "Sustainability is now inside the business case",
        paragraphs: [
          "Buildings are among the largest energy users and carbon emitters in the economy, so the choices made on a construction project have consequences far beyond the client's balance sheet. Fewings & Henjewele's integrated approach embeds sustainability, health & safety, and social responsibility *inside* the time–cost–quality triangle — and the change starts in the business case, where responsible use of scarce resources is designed in, not added later.",
          "For the client this is increasingly not optional: regulation, funders, corporate ESG commitments, and end-user expectations all now push sustainability into the project's core objectives.",
        ],
      },
      {
        heading: "Think whole-life, not first cost",
        paragraphs: [
          "The central discipline of sustainable delivery is whole-life cost. A more efficient building envelope, better glazing, or on-site generation usually costs more to build and far less to run. Judging those decisions on capital cost alone kills them; judging them on whole-life cost — capital plus decades of energy, water, and maintenance — usually justifies them. This is the same whole-life logic the business-case and value-management lessons rely on, applied to environmental performance.",
          "The book notes a real-world wrinkle: owner-occupiers invest in sustainability more readily than developers who lease the building out, because the party paying the higher capital cost isn't always the party who reaps the lower operating cost. Aligning that incentive is part of the sustainability challenge.",
        ],
      },
      {
        heading: "The rating systems",
        bullets: [
          "BREEAM (UK) and LEED (US) score a building across categories — energy, water, materials, health & wellbeing, site ecology, waste — and certify it at levels. They give clients a recognizable target and the team a scorecard to design and build against.",
          "Ratings are earned across the whole delivery, not just the design: sustainable and considerate *construction* (waste recycling, low-impact site practices) earns points too, which pulls the contractor into the sustainability story.",
          "The book cites projects achieving very high BREEAM ratings and near-total waste recycling — driven by a genuine sustainability philosophy, disciplined specification of sustainable materials/systems, and concrete measures like rainwater harvesting and micro-generation.",
        ],
      },
      {
        heading: "Where sustainable choices actually get made — and resilience",
        paragraphs: [
          "Most of the environmental outcome is locked in early — orientation, form, envelope, and systems are decided in design, and materials in specification and buyout. By the time you're on site, the big levers are largely set; the contractor's contribution is in low-impact construction, waste management, protecting what was specified, and not value-engineering the sustainability out under cost pressure.",
          "The book extends the theme to resilience — designing buildings to cope with a changing climate (flooding, rising temperatures) as an increment to smart and sustainable systems. For the PM, the practical takeaway is to protect the sustainability intent through the parts of the project you control: hold the specified materials and systems through buyout and change management, and treat 'value-engineering out the green features' as the failure of integration that it usually is.",
        ],
      },
      {
        heading: "Case in point: high-performing sustainable buildings",
        paragraphs: [
          "The book's sample of high-performing buildings shows a consistent pattern: their clients treat reducing CO₂ emissions and embracing sustainable solutions as a responsibility, not a marketing line — and that culture of commitment is what produces the ratings, not any single technology. Concrete measures cited include rainwater harvesting, micro-generation for green energy, near-total construction-waste recycling, and 'cradle-to-cradle' material choices.",
          "It also surfaces the incentive problem this lesson flags: owner-occupied offices achieve better sustainability ratings than buildings leased out, because the party paying the higher up-front cost isn't always the one who reaps the lower operating cost. Where the owner both pays and operates, whole-life logic wins easily; where those are split, someone has to align the incentive or the sustainability gets value-engineered away.",
        ],
      },
    ],
    relatedLessonIds: ["pm-business-case", "pm-risk-value", "pf-codes"],
    links: [PRACTICE_LINK],
  },
  {
    id: "pm-closeout",
    track: "closeout",
    category: "Handover & Turnover",
    title: "Project Close-Out & Systems Improvement",
    summary:
      "Closing a project is a managed process, not just running out of work — an ordered handover to the user plus the lessons-learned loop that makes the next project better. Why the industry keeps skipping the second half.",
    minutes: 7,
    keyTerms: [
      { term: "Close-out", definition: "Bringing the project to an ordered end and handing it over to the user — completing the work, resolving the punch list, transferring documentation, and settling the accounts." },
      { term: "Practical / substantial completion", definition: "The point at which the building is complete enough for the client to occupy and use it for its intended purpose, even if minor items remain — it triggers occupancy, warranty periods, and the release of retainage." },
      { term: "Lessons learned", definition: "The structured capture of what went well and badly on a project so the knowledge feeds the next one — the 'systems improvement' half of close-out that fragmentation usually loses." },
      { term: "Soft landings / handover", definition: "A managed transition that supports the client and operator into the building — training, tuning the systems, and staying engaged through early operation rather than disappearing at completion." },
    ],
    body: [
      {
        heading: "Close-out is a managed stage, not the absence of work",
        paragraphs: [
          "PRINCE2 defines closing a project as bringing it to an end and handing over to the user in an *ordered* way — the emphasis is on ordered. Left unmanaged, close-out is where projects sour: the crew has demobilized, the interesting work is done, attention has moved to the next job, and the punch list, documentation, and final accounts drag on for months, eroding the client relationship right at the moment it matters most.",
        ],
      },
      {
        heading: "What an ordered close-out delivers",
        ordered: [
          "Complete and test the work — finish outstanding items, test and commission all systems, and demonstrate they perform (the testing/commissioning dependency web from the technical track).",
          "Resolve the punch/snag list — walk the building, list the defects, close them out promptly, and get the client's sign-off.",
          "Achieve practical/substantial completion — the formal milestone that lets the client occupy, starts the warranty clock, and releases retainage.",
          "Transfer documentation — as-builts, O&M manuals, warranties, test certificates, and the digital model/data the operator needs to run the building.",
          "Settle the accounts — final change orders, final subcontractor payments, lien waivers, and the final owner billing.",
          "Support handover — train the operator, tune the building in early operation, and don't simply vanish at completion.",
        ],
      },
      {
        heading: "The half the industry skips: systems improvement",
        paragraphs: [
          "The book pairs close-out with *systems improvement* on purpose. Close-out is the one moment when the whole team knows exactly what went right and wrong — and fragmentation is the reason that knowledge is almost always lost. The team disperses, everyone moves on, and the next project re-learns the same painful lessons. This is the loosely-coupled-system problem in its most expensive form.",
          "A disciplined lessons-learned review — what estimating missed, which details caused RFIs, which subs performed, where the schedule logic broke — is how an organization stops paying tuition on the same mistakes. It's cheap to run and it's the direct feed into better estimating, better constructability reviews, and better risk registers on the next job.",
        ],
      },
      {
        heading: "For the SiteCommand PM",
        paragraphs: [
          "SiteCommand's close-out workflow, punch list, and change history are the mechanics of an ordered close-out; the phase reviews and the wider record are the mechanics of systems improvement. Treat the final 5% of the job with the same rigor as the first 5% — the client's lasting impression, the warranty relationship, and the next project's head start are all decided here, long after the exciting work is over.",
        ],
      },
    ],
    relatedLessonIds: ["wf-punch-closeout", "pm-quality", "pf-estimating"],
    links: [PRACTICE_LINK],
  },

  // ───────────────────────────── Capstone ─────────────────────────────
  {
    id: "pm-cases",
    track: "foundations",
    category: "Capstone",
    title: "Case Studies: The Integrated Approach in Practice",
    summary:
      "Six real projects from the literature, read through the frameworks in this track — success priorities, ethics, the business case, procurement routes, risk-sharing, and sustainability. The capstone quiz is scenario-based.",
    minutes: 10,
    keyTerms: [
      { term: "Scenario reasoning", definition: "Applying a framework to a concrete situation rather than reciting the definition — the skill this capstone tests. Real projects rarely announce which principle applies." },
    ],
    body: [
      {
        heading: "Why case studies",
        paragraphs: [
          "Frameworks are only useful if you can recognize which one a live situation calls for. This capstone revisits six real projects — each already introduced as a 'Case in point' in an earlier lesson — and reads them through the frameworks of this track. Then the quiz drops you into scenarios and asks you to make the call, the way a project actually will.",
        ],
      },
      {
        heading: "1. King Shaka International Airport — priorities and stakeholders",
        paragraphs: [
          "A $1bn airport built to open for the 2010 World Cup: time and quality were the declared priorities, budget secondary. The PM built the team around that single-corner priority. But the most powerful external stakeholder — the environmental authority — still delayed the job past a contractual design deadline. Lesson: declaring your triangle priority organizes the team; it does not exempt you from stakeholder power.",
        ],
      },
      {
        heading: "2. Considerate Constructor Scheme — ethics as commercial advantage",
        paragraphs: [
          "A voluntary UK scheme rewarding community engagement, safety, and sustainable site practice. It spread because ethical behavior reduced neighbor conflict, lifted client reputation, and helped in value-driven tenders — while the counter-cases (cover-pricing investigations, quality failures from unethical procurement) show the downside of the short cut. Ethics is reputation management with a long payback.",
        ],
      },
      {
        heading: "3. London 2012 — a business case managed after approval",
        paragraphs: [
          "Legacy justified the spend on briefly-used venues; the stadium was designed from day one to shrink afterward. When the reduced stadium under-earned, it was leased to a football club to preserve the public legacy — legacy held as the priority over revenue. The business case was steered the whole way through, not frozen at approval.",
        ],
      },
      {
        heading: "4. Hong Kong NEC3 — the route creates the behavior",
        paragraphs: [
          "A £45m public infrastructure package on NEC3 Option C, with up-front training in early warnings and open-book working. When a storm drain threatened to clash with existing utilities, the contractor raised an early warning and a joint risk-reduction meeting resolved it before it became a claim. The collaborative procurement route produced the early-warning behavior that caught the problem.",
        ],
      },
      {
        heading: "5. Heathrow Terminal 5 — risk-sharing, not risk-dumping",
        paragraphs: [
          "On a £4.2bn program, BAA had contractors work open-book and agreed to carry proven residual and excess risk itself, across all supply-chain tiers so risk couldn't be passed down. Managing risk at its cause — rather than transferring it — removed the confrontation and the price-padding that mis-allocated risk creates.",
        ],
      },
      {
        heading: "6. High-performing sustainable buildings — whole-life and incentives",
        paragraphs: [
          "A culture of client commitment (not any single gadget) produces the top sustainability ratings, via rainwater harvesting, micro-generation, near-total waste recycling, and cradle-to-cradle materials. Owner-occupiers out-perform lease-out developers because the party paying the up-front cost is the one reaping the operating saving — the whole-life incentive is aligned.",
        ],
      },
      {
        heading: "Now apply them",
        paragraphs: [
          "The quiz below is scenario-based: each question puts you in a situation drawn from these cases and asks which framework applies and what you'd do. There isn't always a single perfect answer in real life — but there is usually a best one given the principles in this track.",
        ],
      },
    ],
    relatedLessonIds: ["pm-success", "pm-procurement-strategy", "pm-risk-value", "pm-sustainability"],
    links: [PRACTICE_LINK],
  },
];
