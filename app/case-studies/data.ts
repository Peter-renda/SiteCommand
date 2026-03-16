export type CaseStudy = {
  slug: string;
  companyName: string;
  location: string;
  companyType: string;
  projectName: string;
  projectSize: string;
  duration: string;
  teamSize: string;
  headlineStat: string;
  headlineStatLabel: string;
  shortDescription: string;
  challenge: string;
  solution: string;
  results: string;
  quote: string;
  quoteAuthor: string;
  metrics: { label: string; value: string }[];
  featuresUsed: { label: string; icon: string }[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "meridian-commercial",
    companyName: "Meridian Construction Group",
    location: "Chicago, IL",
    companyType: "Commercial GC",
    projectName: "12-Story Mixed-Use Tower",
    projectSize: "$48M",
    duration: "22 months",
    teamSize: "18 subcontractors",
    headlineStat: "67%",
    headlineStatLabel: "Reduction in RFI cycle time",
    shortDescription:
      "A Chicago-based GC eliminated email chaos across 18 subcontractors and closed a $48M tower 3 weeks ahead of schedule.",
    challenge:
      "Meridian was managing over 400 RFIs across 18 subcontractors entirely through email. Threads would go unanswered for days, critical attachments were buried in inboxes, and the project manager had no reliable way to track open items. By month four, RFI backlog had grown to 80+ open items and was threatening to push the schedule.",
    solution:
      "Meridian adopted SiteCommand's RFI, submittal, and daily log workflow for the project. Every RFI was logged in the platform, routed to the right party, and tracked through closure. Subcontractors received notifications and could respond directly without logging into a separate system. The daily log gave the PM a single source of truth for on-site activity and manpower.",
    results:
      "RFI cycle time dropped from an average of 11 days to under 4. The backlog cleared within six weeks of going live. The project closed 3 weeks ahead of the original schedule, and because every change was documented in the platform, there were zero disputed change orders at project closeout.",
    quote:
      "We used to lose days chasing email threads. Now everything is in one place and the subs actually respond.",
    quoteAuthor: "Project Manager, Meridian Construction Group",
    metrics: [
      { label: "Project Value", value: "$48M" },
      { label: "Duration", value: "22 months" },
      { label: "Subcontractors", value: "18" },
      { label: "RFIs Managed", value: "400+" },
    ],
    featuresUsed: [
      { label: "RFI Management", icon: "rfi" },
      { label: "Submittals", icon: "submittal" },
      { label: "Daily Log", icon: "log" },
      { label: "Change Orders", icon: "change" },
    ],
  },
  {
    slug: "harvest-residential",
    companyName: "Harvest Development Partners",
    location: "Austin, TX",
    companyType: "Residential Developer",
    projectName: "64-Unit Build-to-Rent Community",
    projectSize: "$14M",
    duration: "14 months",
    teamSize: "8 contracts",
    headlineStat: "$180K",
    headlineStatLabel: "Saved in avoided rework",
    shortDescription:
      "An Austin BTR developer replaced spreadsheet change order tracking with live budget visibility and managed all 8 contracts in a single platform.",
    challenge:
      "Harvest was running a 64-unit build-to-rent project with no real-time budget visibility. Change orders were tracked on spreadsheets passed between the PM, the owner, and the lender. By the time a CO was approved and recorded, the live project cost was already days out of date. The team was constantly reconciling numbers at draw time, creating friction with their construction lender.",
    solution:
      "SiteCommand's budget and commitments module gave the owner a live dashboard showing original budget, approved change orders, committed costs, and forecast-to-complete at all times. All 8 GC and subcontractor contracts were entered into the platform, and every change order was created, tracked, and approved digitally — no spreadsheets, no email attachments.",
    results:
      "$180K in rework costs were avoided because budget variances were caught in real time rather than at draw reconciliation. The construction lender commented on the quality of draw documentation. All 8 contracts were managed inside the platform from notice to proceed through final payment.",
    quote:
      "Our lender asked how we had such clean draw documentation. That's SiteCommand.",
    quoteAuthor: "Owner / Developer, Harvest Development Partners",
    metrics: [
      { label: "Project Value", value: "$14M" },
      { label: "Duration", value: "14 months" },
      { label: "Units", value: "64" },
      { label: "Contracts Managed", value: "8" },
    ],
    featuresUsed: [
      { label: "Budget Management", icon: "budget" },
      { label: "Commitments", icon: "commitments" },
      { label: "Change Orders", icon: "change" },
      { label: "Cost Tracking", icon: "cost" },
    ],
  },
  {
    slug: "apex-specialty",
    companyName: "Apex MEP Solutions",
    location: "Denver, CO",
    companyType: "Specialty Subcontractor",
    projectName: "Healthcare Campus MEP Fit-Out",
    projectSize: "$8.5M scope",
    duration: "16 months",
    teamSize: "1 subcontractor scope",
    headlineStat: "3x",
    headlineStatLabel: "Faster submittal approvals",
    shortDescription:
      "A Denver mechanical sub eliminated missed deadlines and strengthened its GC relationship — earning two follow-on project awards in the process.",
    challenge:
      "Apex MEP was managing its submittal and RFI responses entirely through the GC's proprietary portal — a system built for the GC, not the sub. Notifications were inconsistent, responses required navigating multiple login systems, and Apex regularly missed approval windows because the right person never saw the request in time. Late submittal penalties had become a recurring cost of doing business.",
    solution:
      "The GC added Apex as an external collaborator on SiteCommand. Apex received direct notifications when RFIs and submittals required their input, and could respond from a single interface without switching systems. The project executive had visibility into every open item assigned to Apex and could escalate internally before deadlines were missed.",
    results:
      "Submittal approval time dropped from an average of 18 days to 6. Apex recorded zero late submittal penalties for the first time on a project of this size. The improved responsiveness directly contributed to two follow-on project awards from the same GC within 12 months of project completion.",
    quote:
      "As a sub, we finally have a tool that works for us, not just the GC.",
    quoteAuthor: "Project Executive, Apex MEP Solutions",
    metrics: [
      { label: "Scope Value", value: "$8.5M" },
      { label: "Duration", value: "16 months" },
      { label: "Avg Submittal Time", value: "6 days" },
      { label: "Follow-On Awards", value: "2" },
    ],
    featuresUsed: [
      { label: "RFI Management", icon: "rfi" },
      { label: "Submittals", icon: "submittal" },
      { label: "External Collaborator", icon: "external" },
      { label: "Notifications", icon: "notify" },
    ],
  },
];
