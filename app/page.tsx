import type { ReactNode } from "react";
import Navbar from "./components/Navbar";

/**
 * Home / landing page — "Field Command / Blueprint" design.
 *
 * The Construction Project Management Academy (CPMA) is the training
 * program; SiteCommand is its sandboxed software. People learning
 * construction project management get "real-world" experience by actually
 * running a real (but sandboxed) project with the production tools. Every
 * claim maps to a shipped feature (see app/training/* and CLAUDE.md).
 *
 * The visual language leans into the domain: a dark "command console" hero on
 * a blueprint grid, a scrolling tool tape, technical mono annotations,
 * blueprint registration ticks on cards, and a safety-orange / blueprint-blue
 * accent system.
 */

const INK = "#0E0E0C";
const ORANGE = "#EA580C";
const LIGHT_BG = "#FAF9F6";

// The whole production toolset, scrolled as a "tool tape."
const tools = [
  "RFIs", "Submittals", "Buyout", "Change Events", "Commitments", "Budget",
  "Daily Logs", "Pay Apps", "Lien Waivers", "Meetings", "Emails", "Punch List",
  "Transmittals", "Schedule", "Change Orders", "Directory",
];

// The three-step arc of the actual Practice flow.
const steps = [
  {
    n: "01",
    tag: "Set up",
    title: "Pick your role & project",
    desc: "Launch a real, sandboxed SiteCommand project. Step in as Project Manager on a live higher-ed build — Superintendent and Project Accounting are on the way.",
  },
  {
    n: "02",
    tag: "Run it",
    title: "Run the job, day by day",
    desc: "Emails, phone calls, tasks, meetings, and end-of-day checks land on a 77-day calendar. The owner, subs, and accounting all write back. A coach walks you through each day.",
  },
  {
    n: "03",
    tag: "Review",
    title: "Get reviewed & improve",
    desc: "At every phase you get a milestone job review that scores your calls, highlights what you nailed, and shows exactly what to catch next time — exportable to PDF.",
  },
];

// The nine Lessons tracks — the real construction lifecycle taxonomy with
// their real lesson counts (lib/training-lessons*.ts, mirrored by
// tests/curriculum.test.ts). Includes the per-trade "Common Products &
// Materials" lessons that survey the products a PM buys and submits.
const tracks = [
  { code: "01", name: "Pre-Construction & Entitlements", count: 16, desc: "Feasibility & zoning, design & engineering, budgeting & procurement, permitting." },
  { code: "02", name: "Site Development & Civil", count: 13, desc: "Survey, erosion control, earthwork, utilities, hardscape, and site products." },
  { code: "03", name: "Substructure & Foundations", count: 6, desc: "Deep and shallow foundations, slab-on-grade, concrete, formwork, and concrete products." },
  { code: "04", name: "Superstructure & Shell", count: 8, desc: "Structural frame, elevated slabs, the envelope, roofing, and their products." },
  { code: "05", name: "Interior Rough-Ins & MEP", count: 17, desc: "Framing, rough carpentry, the MEP pattern, wet systems, HVAC, power, lighting & products." },
  { code: "06", name: "Interior Finishes & Equipment", count: 9, desc: "Drywall, ceilings, flooring, millwork, doors & hardware, MEP trim-out, and finish products." },
  { code: "07", name: "Commissioning & Closeout", count: 5, desc: "Systems commissioning, punch, final inspections, and handover." },
  { code: "PRO", name: "Professional Skills", count: 19, desc: "Money, leadership, managing clients/subs/teams, and the rules of the game." },
  { code: "WF", name: "Workflows & Concepts", count: 29, desc: "SiteCommand's tools plus drawings, specs, CSI, contracts, insurance & the glossary." },
];

// Totals derived from the track list so the marketing copy never drifts from
// the shipped curriculum (lib/training-lessons*.ts).
const totalLessons = tracks.reduce((sum, t) => sum + t.count, 0); // 122
const totalTracks = tracks.length; // 9

const audiences = [
  "New project managers",
  "Construction & CM students",
  "Career-changers into the trades office",
  "Companies onboarding field-to-office staff",
];

// The construction management career ladder — realistic U.S. ranges, entry to exec.
const salaryLadder = [
  { tier: "Start", pay: "$75K", role: "Coordinator · Project Engineer · Assistant PM", note: "Entry — no degree required" },
  { tier: "Grow", pay: "$120K+", role: "Project Manager", note: "A few years of reps in" },
  { tier: "Lead", pay: "$200–300K+", role: "Senior PM · Director · VP", note: "Senior & executive" },
];

// Why the field is hiring — the demand side of the opportunity.
const demandStats = [
  { value: "10,000+", label: "open roles right now" },
  { value: "Months", label: "to hire, not years" },
  { value: "No degree", label: "required to start" },
  { value: "Merit", label: "-based advancement" },
];

// Outcome-focused "what you'll walk away able to do" (the tracks cover the detail).
const learnOutcomes = [
  "How the industry works — owners, GCs, subs, and the project lifecycle",
  "The paperwork that runs a job — contracts, budgets, RFIs, submittals, closeout",
  "How the trades sequence — structural, MEP, and sitework",
  "How to read drawings, specs, and the CSI system",
  "How the money moves — change orders, pay apps, and protecting margin",
  "How to lead — communication, safety, and calls under pressure",
];

// "Day in the life" — an illustrative Project Manager's day, each block mapped
// to the tools and lessons the sandbox trains on. `weight` sizes the segments
// on the left day-bar by duration; `accent` keys each block's color across the
// bar and the accordion. Times are illustrative (*example day).
const dayInLife = [
  {
    accent: "#14B8A6",
    weight: 2,
    title: "Morning Kickoff & Look-Ahead",
    time: "7:00a – 9:00a",
    body: "Read the overnight emails from the owner, subs, and accounting, refresh the three-week look-ahead, and set the day's priorities before the crews roll. Triage what's urgent from what's just loud.",
  },
  {
    accent: "#3B82F6",
    weight: 3,
    title: "Site Walk & Trade Coordination",
    time: "9:00a – 12:00p",
    body: "Walk the job with the superintendent, check installed work against the drawings, and coordinate the trades sharing the same wall and ceiling — catching conflicts on the floor before they become rework.",
  },
  {
    accent: "#F59E0B",
    weight: 1,
    title: "RFIs, Submittals & Reports",
    time: "1:00p – 2:00p",
    body: "Back at the trailer, move the RFI and submittal logs, review a pay application against real progress, and keep the record current. The paperwork that protects the schedule lives or dies on this hour.",
  },
  {
    accent: "#EF4444",
    weight: 1,
    title: "OAC & Subcontractor Meetings",
    time: "2:00p – 3:00p",
    body: "Run the owner–architect–contractor meeting and the weekly sub coordination — align on schedule, open items, and change events, and set clear expectations with the people building the job.",
  },
  {
    accent: "#8B5CF6",
    weight: 2,
    title: "Buyout, Billing & Follow-Up",
    time: "3:00p – 5:00p",
    body: "Close the loops: chase a long-lead order, price a change, review commitments and billing, and log the day. Tomorrow's fires are the ones you knock down here first.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh" style={{ background: LIGHT_BG }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content">
        {/* ═══════════ Dark command block: hero + tool tape ═══════════ */}
        <div className="relative overflow-hidden" style={{ background: INK }}>
          {/* Blueprint grid */}
          <div className="absolute inset-0 sc-bp-grid-dark pointer-events-none" aria-hidden="true" />
          {/* Ambient glows */}
          <div
            className="absolute -top-40 right-0 w-[46rem] h-[46rem] rounded-full pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, rgba(234,88,12,0.20) 0%, transparent 62%)" }}
          />
          <div
            className="absolute top-1/3 -left-40 w-[38rem] h-[38rem] rounded-full pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, transparent 62%)", animationDelay: "2s" }}
          />

          {/* ── Hero ── */}
          <section className="relative px-6 sm:px-10 pt-16 pb-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-14 xl:gap-20 items-center">
                {/* Left: copy */}
                <div>
                  <div className="animate-fade-up mb-7">
                    <MonoTag tone="dark">Field training simulator</MonoTag>
                  </div>

                  <h1 className="font-display animate-fade-up delay-100 text-[clamp(2.9rem,6.6vw,5.4rem)] leading-[0.94] text-white">
                    Run a real jobsite.
                    <br />
                    <span className="sc-text-orange-grad">Before it&apos;s real.</span>
                  </h1>

                  <p className="animate-fade-up delay-200 mt-7 text-lg max-w-md leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>
                    The Construction Project Management Academy (CPMA) is a
                    training ground for construction project management. Take
                    command of a real project in SiteCommand — our sandboxed
                    construction software — with the same tools, inbox, and
                    pressure as the job, a coach in your corner, and no way to
                    get fired.
                  </p>

                  {/* CTAs */}
                  <div className="animate-fade-up delay-300 mt-10 flex flex-wrap items-center gap-3">
                    <a
                      href="/signup"
                      className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all duration-200 active:scale-[0.98]"
                      style={{ background: ORANGE, boxShadow: "0 8px 28px rgba(234,88,12,0.35)" }}
                    >
                      <span className="relative z-10">Start training free</span>
                      <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.14] transition-opacity duration-200" />
                    </a>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.98]"
                      style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
                    >
                      See how it works
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </a>
                  </div>

                  {/* Mono proof line */}
                  <div className="animate-fade-up delay-400 mt-11 pt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-wider uppercase" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                    <span><span style={{ color: ORANGE }}>{totalLessons}</span> guided lessons</span>
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                    <span><span style={{ color: ORANGE }}>10+</span> projects</span>
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                    <span>tangible experience and feedback</span>
                  </div>
                </div>

                {/* Right: jobsite photo */}
                <div className="relative hidden lg:block animate-scale-in delay-200">
                  {/* Glow behind the image */}
                  <div
                    className="absolute -inset-6 rounded-3xl pointer-events-none"
                    aria-hidden="true"
                    style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(234,88,12,0.22) 0%, transparent 70%)" }}
                  />

                  {/* Photo — a PM running the software at the jobsite */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}
                  >
                    <img
                      src="/Gemini_Generated_Image_rl2cnprl2cnprl2c.png"
                      alt="A construction project manager running SiteCommand on a laptop at an active jobsite"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Tool tape ── */}
          <div className="relative overflow-hidden py-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} aria-hidden="true">
            <div className="sc-marquee-track">
              {[...tools, ...tools].map((t, i) => (
                <span key={i} className="inline-flex items-center font-mono text-[12px] tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.42)" }}>
                  <span className="px-6">{t}</span>
                  <span style={{ color: ORANGE }}>/</span>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* ═══════════ The opportunity — industry, salary, what you'll learn ═══════════ */}
        <section className="relative py-24 px-6 sm:px-10 overflow-hidden" style={{ background: "#FFFFFF" }}>
          <div className="relative max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-14 max-w-2xl">
              <div className="mb-4"><MonoTag tone="light">The opportunity</MonoTag></div>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950 leading-tight">
                A career that&apos;s hiring —
                <br />
                no degree required
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Construction management is short on people who can run a job — and
                it pays for the ones who can. A wave of retirements has opened
                thousands of roles, and the door is wide open to anyone who can
                prove they know the work, degree or not.
              </p>
            </div>

            {/* Salary ladder */}
            <div className="mb-4">
              <div className="mb-5"><MonoTag tone="light">What it pays</MonoTag></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {salaryLadder.map((rung, i) => {
                  const dark = i === salaryLadder.length - 1;
                  return (
                    <div
                      key={rung.tier}
                      className="sc-card relative rounded-xl p-7"
                      style={{
                        background: dark ? INK : "#FFFFFF",
                        border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(14,14,12,0.09)",
                      }}
                    >
                      <CornerTicks color={dark ? "rgba(255,255,255,0.28)" : "rgba(14,14,12,0.22)"} />
                      <MonoTag tone={dark ? "dark" : "light"} className="mb-4">{rung.tier}</MonoTag>
                      <p className={`font-display text-4xl tabular-nums ${dark ? "text-white" : "text-gray-950"}`}>
                        {rung.pay}
                        <span className="text-base font-mono" style={{ color: dark ? "rgba(255,255,255,0.4)" : "#9CA3AF" }}> / yr</span>
                      </p>
                      <p className={`mt-2 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{rung.role}</p>
                      <p className="mt-1 text-xs" style={{ color: dark ? "rgba(255,255,255,0.5)" : "#9CA3AF" }}>{rung.note}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 font-mono text-[10px] tracking-wide uppercase text-gray-400">
                Ranges reflect typical U.S. construction management roles, entry through executive
              </p>
            </div>

            {/* Demand + what you'll learn */}
            <div className="mt-14 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
              {/* Demand stats */}
              <div>
                <div className="mb-5"><MonoTag tone="light">The demand</MonoTag></div>
                <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(14,14,12,0.08)", border: "1px solid rgba(14,14,12,0.08)" }}>
                  {demandStats.map((s) => (
                    <div key={s.label} className="bg-white p-6 flex flex-col gap-1">
                      <span className="font-display text-3xl text-gray-950 tabular-nums">{s.value}</span>
                      <span className="font-mono text-[11px] tracking-wide uppercase text-gray-400 leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What you'll learn */}
              <div>
                <div className="mb-5"><MonoTag tone="light">What you&apos;ll learn</MonoTag></div>
                <ul className="space-y-3">
                  {learnOutcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3">
                      <span className="mt-1 w-4 h-4 rounded-[5px] shrink-0 flex items-center justify-center" style={{ background: ORANGE }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-[15px] text-gray-600 leading-relaxed">{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ How it works ═══════════ */}
        <section id="how-it-works" className="relative py-24 px-6 sm:px-10 scroll-mt-16 overflow-hidden" style={{ background: LIGHT_BG }}>
          <div className="absolute inset-0 sc-bp-grid-light opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <div className="mb-4"><MonoTag tone="light">How it works</MonoTag></div>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950">Reps, not lectures.</h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                You don&apos;t watch a course — you show up and run the project.
                Everything that happens on a real job happens here, on a schedule
                you can&apos;t fully control.
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
              {/* Connecting timeline rule (desktop) */}
              <div className="hidden md:block absolute top-[18px] left-[8%] right-[8%] border-t border-dashed pointer-events-none" style={{ borderColor: "rgba(14,14,12,0.18)" }} aria-hidden="true" />
              {steps.map((step) => (
                <div key={step.n} className="relative flex flex-col items-start gap-5">
                  <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-semibold text-white" style={{ background: ORANGE, boxShadow: "0 4px 14px rgba(234,88,12,0.4)" }}>
                    {step.n}
                  </div>
                  <div className="sc-card relative w-full bg-white rounded-xl p-7" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
                    <CornerTicks />
                    <MonoTag tone="light" className="mb-3">{step.tag}</MonoTag>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ The experience — bento ═══════════ */}
        <section className="py-24 px-6 sm:px-10" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(14,14,12,0.07)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="mb-4"><MonoTag tone="light">The experience</MonoTag></div>
                <h2 className="font-display text-4xl sm:text-5xl text-gray-950">
                  A jobsite that
                  <br />
                  writes back
                </h2>
              </div>
              <p className="text-sm text-gray-500 max-w-xs sm:text-right shrink-0">
                Every tool below is the real thing — the same software teams use to
                run live construction projects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Large: Run a real project */}
              <div className="md:col-span-2">
                <Card>
                  <div className="flex flex-col gap-5 h-full">
                    <div className="flex items-start gap-4">
                      <FeatureIcon color="#2563EB" path="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 4h16M9 4v16" />
                      <div>
                        <MonoTag tone="light" className="mb-2">Sandbox</MonoTag>
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">Run a real, sandboxed project</h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                          RFIs, submittals, commitments &amp; buyout, change events,
                          budget, daily logs — the production tools, seeded with a
                          full directory and a live project. Nothing is faked, and
                          nothing you do can break the real world.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      {["RFIs", "Submittals", "Commitments", "Change Events", "Budget", "Daily Logs", "Emails"].map((t) => (
                        <span key={t} className="px-2.5 py-1 font-mono text-[11px] rounded-md text-gray-600" style={{ background: "#F5F5F4", border: "1px solid rgba(0,0,0,0.06)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Small: Living inbox */}
              <FeatureCard
                tag="Comms"
                color="#6366F1"
                iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                title="A living inbox"
                desc="The owner, vendors, and accounting email you on a schedule. Reply and they reply back — realistically, in character."
              />

              {/* Small: AI coach */}
              <FeatureCard
                tag="Coach"
                color="#EA580C"
                iconPath="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12M8 9v6l-4-3 4-3z"
                title="An AI coach in your corner"
                desc="A briefing at the start of every day tells you what matters and why — surfaced right where you're working, not buried in a manual."
              />

              {/* Large DARK: Interactive meetings */}
              <div className="md:col-span-2">
                <div className="sc-card relative h-full rounded-xl p-7 overflow-hidden" style={{ background: INK, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="absolute inset-0 sc-bp-grid-dark opacity-70 pointer-events-none" aria-hidden="true" />
                  <CornerTicks color="rgba(255,255,255,0.28)" />
                  <div className="relative flex flex-col gap-5 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(234,88,12,0.16)" }}>
                        <svg className="w-5 h-5" style={{ color: "#F9A03F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
                        </svg>
                      </div>
                      <div>
                        <MonoTag tone="dark" className="mb-2">Meetings</MonoTag>
                        <h3 className="text-base font-semibold text-white mb-1.5">Sit in on real meetings</h3>
                        <p className="text-sm leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
                          Attend the preconstruction bid review as a live conversation.
                          The estimator and project executive talk; when the floor comes
                          to you, you answer. You&apos;re scored on the issues you catch —
                          the long-lead switchgear, the steel scope gap, the price hold.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2 pt-2">
                      <div className="flex gap-2 items-start">
                        <span className="font-mono text-[10px] font-semibold w-16 shrink-0 pt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Rachel · Est.</span>
                        <span className="text-[11px] rounded-lg px-2.5 py-1.5 leading-snug" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
                          Steel came in low, but I think there&apos;s a scope gap on connections…
                        </span>
                      </div>
                      <div className="flex gap-2 items-start justify-end">
                        <span className="text-[11px] rounded-lg px-2.5 py-1.5 leading-snug text-white" style={{ background: ORANGE }}>
                          Let&apos;s hold the award until we level that. What&apos;s the switchgear lead time?
                        </span>
                        <span className="font-mono text-[10px] font-semibold w-10 shrink-0 pt-1" style={{ color: "#F9A03F" }}>You · PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Small: Day by day */}
              <FeatureCard
                tag="Cadence"
                color="#0EA5E9"
                iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="Day by day, start to finish"
                desc="A 77-day build across six phases — tasks, phone calls, and end-of-day checks that arrive whether you're ready or not."
              />

              {/* Small: Milestone reviews */}
              <FeatureCard
                tag="Review"
                color="#10B981"
                iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                title="Milestone job reviews"
                desc="At each phase, an AI performance review scores your decisions, flags what you missed, and exports to PDF."
              />

              {/* Small: Curriculum */}
              <FeatureCard
                tag="Learn"
                color="#F59E0B"
                iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                title={`A ${totalLessons}-lesson curriculum`}
                desc="The workflows and the construction knowledge behind them — deep-linked from the exact day you're living through."
              />
            </div>
          </div>
        </section>

        {/* ═══════════ Day in the life ═══════════ */}
        <section className="relative py-24 px-6 sm:px-10 overflow-hidden" style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Blueprint grid + ambient glows */}
          <div className="absolute inset-0 sc-bp-grid-dark pointer-events-none" aria-hidden="true" />
          <div
            className="absolute -top-32 right-0 w-[40rem] h-[40rem] rounded-full pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, rgba(234,88,12,0.14) 0%, transparent 62%)" }}
          />
          <div
            className="absolute bottom-0 -left-40 w-[34rem] h-[34rem] rounded-full pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 62%)", animationDelay: "1.5s" }}
          />

          <div className="relative max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-4 flex justify-center"><MonoTag tone="dark">Day in the life</MonoTag></div>
              <h2 className="font-display text-4xl sm:text-5xl text-white leading-tight">
                What could your days look like?
              </h2>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                From the morning inbox to the end-of-day log, here&apos;s an example
                project manager&apos;s day — the exact rhythm you rehearse in the sandbox.
              </p>
            </div>

            {/* Console day-card + accordion */}
            <div className="mt-14 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-14 items-start">
              {/* Left: the day, at a glance */}
              <div
                className="lg:sticky lg:top-24 relative rounded-2xl p-7 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <CornerTicks color="rgba(255,255,255,0.18)" />
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                  *Example day · Project Manager
                </div>
                <div className="mt-3 font-display text-white leading-none" style={{ fontSize: "clamp(2.1rem,4.4vw,3rem)" }}>
                  7:00a <span style={{ color: ORANGE }}>→</span> 5:00p
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Ten hours, five moves. Every block runs through the same inbox,
                  logs, and tools you train on in SiteCommand — so the day already
                  feels familiar on your first real one.
                </p>

                {/* Day bar — colored segments sized by duration */}
                <div className="mt-7" aria-hidden="true">
                  <div className="flex gap-1 h-3">
                    {dayInLife.map((d) => (
                      <span key={d.title} className="rounded-sm" style={{ flexGrow: d.weight, background: d.accent, boxShadow: `0 0 12px ${d.accent}55` }} />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span>7:00a</span>
                    <span>12:00p</span>
                    <span>5:00p</span>
                  </div>
                </div>

                <a
                  href="/signup"
                  className="group mt-7 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  <span className="group-hover:text-white transition-colors">Run a day yourself</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: ORANGE }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>

              {/* Right: expandable timeline */}
              <div className="flex flex-col gap-3">
                {dayInLife.map((d, i) => (
                  <details
                    key={d.title}
                    open={i === 0}
                    className="group relative rounded-xl overflow-hidden transition-colors open:bg-white/[0.04] hover:bg-white/[0.04]"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: d.accent }} aria-hidden="true" />
                    <summary className="list-none marker:content-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 pl-6 pr-5 py-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{d.title}</h3>
                        <p className="mt-0.5 font-mono text-[12px] tracking-wide tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>{d.time}</p>
                      </div>
                      <span
                        className="shrink-0 grid place-items-center w-8 h-8 rounded-full transition-transform duration-200 group-open:rotate-45"
                        style={{ border: "1px solid rgba(255,255,255,0.25)" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.8)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </summary>
                    <div className="pl-6 pr-6 pb-5 -mt-1">
                      <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>{d.body}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ Curriculum — sheet index ═══════════ */}
        <section className="relative py-24 px-6 sm:px-10 overflow-hidden" style={{ background: LIGHT_BG, borderTop: "1px solid rgba(14,14,12,0.07)" }}>
          <div className="absolute inset-0 sc-bp-grid-light opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1.4fr] gap-12 lg:gap-16 items-start">
            {/* Intro */}
            <div className="lg:sticky lg:top-24">
              <div className="mb-4"><MonoTag tone="light">The curriculum</MonoTag></div>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950 leading-tight">
                Learn the craft,
                <br />
                then run the job
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                {totalLessons} hand-written lessons across {totalTracks} tracks — from how to
                read a drawing set to how MEP sequencing drives your schedule.
                Read ahead, or open the one your day just handed you.
              </p>
              <div className="mt-8 inline-flex items-baseline gap-3 rounded-xl px-6 py-4" style={{ background: INK }}>
                <span className="font-display text-5xl text-white tabular-nums leading-none">{totalLessons}</span>
                <span className="font-mono text-[11px] tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                  lessons<br />&amp; counting
                </span>
              </div>
            </div>

            {/* Sheet index */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(14,14,12,0.1)", background: "#FFFFFF" }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ background: "#F5F5F4", borderBottom: "1px solid rgba(14,14,12,0.08)" }}>
                <span className="font-mono text-[11px] tracking-widest uppercase text-gray-500">Track index</span>
                <span className="font-mono text-[11px] tracking-widest uppercase text-gray-400">Lessons</span>
              </div>
              {tracks.map((track) => (
                <div key={track.code} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAF9]" style={{ borderBottom: "1px solid rgba(14,14,12,0.06)" }}>
                  <span className="font-mono text-[11px] font-semibold w-11 shrink-0 tabular-nums" style={{ color: ORANGE }}>{track.code}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{track.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{track.desc}</p>
                  </div>
                  <span className="font-display text-2xl text-gray-950 tabular-nums shrink-0 w-8 text-right">{track.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ Who it's for ═══════════ */}
        <section className="py-16 px-6 sm:px-10" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(14,14,12,0.07)" }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <h2 className="font-display text-2xl sm:text-3xl text-gray-950 shrink-0 md:max-w-[14rem]">
              Built for anyone stepping onto the job.
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {audiences.map((a) => (
                <span key={a} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 rounded-full" style={{ background: "#F5F5F4", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ Final CTA (dark bookend) ═══════════ */}
        <section className="relative overflow-hidden px-6 sm:px-10 py-28" style={{ background: INK }}>
          <div className="absolute inset-0 sc-bp-grid-dark pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(234,88,12,0.18) 0%, transparent 68%)" }}
          />
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="mb-6 flex justify-center"><MonoTag tone="dark">Your first day starts now</MonoTag></div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
              Ready to run your
              <br />
              first project?
            </h2>
            <p className="mt-5 text-lg max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Launch a sandbox, open your inbox, and take command — no
              experience required, no way to get it wrong for real.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/signup"
                className="group relative inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all duration-200 active:scale-[0.98]"
                style={{ background: ORANGE, boxShadow: "0 8px 28px rgba(234,88,12,0.4)" }}
              >
                <span className="relative z-10">Start training free</span>
                <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.14] transition-opacity duration-200" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center px-8 py-4 text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.98]"
                style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                I already have an account
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════ Footer (dark) ═══════════ */}
      <footer className="py-10 px-6 sm:px-10" style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="font-display text-sm text-white">The Construction Project Management Academy</span>
          <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
            <a href="/signup" className="hover:text-white transition-colors">Start training</a>
            <a href="/pricing" className="hover:text-white transition-colors">Get Started</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} CPMA
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Helper components ─────────────────────────────────────────────────── */

/** Technical mono label with a leading safety-orange square. */
function MonoTag({ children, tone = "light", className = "" }: { children: ReactNode; tone?: "dark" | "light"; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase ${className}`}
      style={{ color: tone === "dark" ? "rgba(255,255,255,0.55)" : "#6B7280" }}
    >
      <span className="w-2 h-2 shrink-0" style={{ background: ORANGE }} />
      {children}
    </span>
  );
}

/** Blueprint registration ticks in the four corners of a card. */
function CornerTicks({ color = "rgba(14,14,12,0.22)" }: { color?: string }) {
  const base = "absolute w-2.5 h-2.5 pointer-events-none";
  return (
    <>
      <span className={`${base} top-2 left-2`} style={{ borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} top-2 right-2`} style={{ borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} bottom-2 left-2`} style={{ borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} bottom-2 right-2`} style={{ borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} aria-hidden="true" />
    </>
  );
}

/** White technical card with hairline border, corner ticks, and hover lift. */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sc-card relative h-full bg-white rounded-xl p-7 ${className}`} style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
      <CornerTicks />
      {children}
    </div>
  );
}

/** Rounded accent icon tile. */
function FeatureIcon({ color, path }: { color: string; path: string }) {
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
      <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
      </svg>
    </div>
  );
}

/** Standard (single-column) feature tile. */
function FeatureCard({ tag, color, iconPath, title, desc }: { tag: string; color: string; iconPath: string; title: string; desc: string }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 h-full">
        <FeatureIcon color={color} path={iconPath} />
        <div>
          <MonoTag tone="light" className="mb-2">{tag}</MonoTag>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Card>
  );
}
