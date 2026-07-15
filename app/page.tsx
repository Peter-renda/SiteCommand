import Navbar from "./components/Navbar";
import Bezel from "./components/Bezel";
import Eyebrow from "./components/Eyebrow";

/**
 * Home / landing page.
 *
 * SiteCommand is positioned as a hands-on training tool: people learning
 * construction project management get "real-world" experience by actually
 * running a real (but sandboxed) project with the production tools — a living
 * inbox, AI counterparties, an audio coach, scored meetings, milestone reviews,
 * and a 70-lesson curriculum. Every claim below maps to a shipped feature (see
 * app/training/* and the Training notes in CLAUDE.md).
 */

// Honest, specific numbers pulled from the real product.
const stats = [
  { value: "70", label: "Lessons · 7 tracks" },
  { value: "70-day", label: "Simulated build" },
  { value: "Real tools", label: "Not a slideshow" },
  { value: "AI-driven", label: "Coach & counterparties" },
];

// The three-step arc of the actual Practice flow.
const steps = [
  {
    n: "01",
    title: "Pick your role & project",
    desc: "Launch a real, sandboxed SiteCommand project. Step in as Project Manager on a live higher-ed build — Superintendent and Project Accounting are on the way.",
  },
  {
    n: "02",
    title: "Run the job, day by day",
    desc: "Emails, phone calls, tasks, meetings, and end-of-day checks land on a 70-day calendar. The owner, subs, and accounting all write back. A coach walks you through each day.",
  },
  {
    n: "03",
    title: "Get reviewed & improve",
    desc: "At every phase you get a milestone job review that scores your calls, highlights what you nailed, and shows exactly what to catch next time — exportable to PDF.",
  },
];

// The seven Lessons tracks with their real lesson counts (see lib/training-lessons*.ts).
const tracks = [
  { name: "Workflows", count: 14, desc: "RFIs, submittals, buyout, change events, billing — the SiteCommand way." },
  { name: "Concepts", count: 10, desc: "Reading drawings & specs, CSI divisions, retainage, contract types." },
  { name: "Building the Work", count: 11, desc: "Means & methods in build sequence, sitework through commissioning." },
  { name: "Site & Civil", count: 12, desc: "Grading, E&S/SWPPP, stormwater, utilities, ADA, entitlements." },
  { name: "MEP Systems", count: 11, desc: "Every system as schedule logic — first fix, startup & Cx." },
  { name: "Contracts & Commercial", count: 6, desc: "Delivery methods, AIA docs, subcontracts, liens, bonds, claims." },
  { name: "Professional Skills", count: 6, desc: "Financial literacy, estimating, leadership, codes, and ethics." },
];

// Audiences the training positioning speaks to.
const audiences = [
  "New project managers",
  "Construction & CM students",
  "Career-changers into the trades office",
  "Companies onboarding field-to-office staff",
];

export default function Home() {
  return (
    <div className="min-h-dvh" style={{ background: "#FAFAF9" }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />

      <main id="main-content">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-20 pb-20 px-6 sm:px-10">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 75% 25%, rgba(212,80,10,0.06) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 15% 85%, rgba(37,99,235,0.05) 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px] gap-12 xl:gap-20 items-center">

              {/* ── Left: Copy ── */}
              <div>
                {/* Eyebrow tag */}
                <div className="animate-fade-up mb-8">
                  <Eyebrow>Learn construction by doing it</Eyebrow>
                </div>

                {/* Headline — DM Serif Display for editorial luxury */}
                <h1
                  className="font-display animate-fade-up delay-100 text-[clamp(2.8rem,6.5vw,5.2rem)] leading-[0.96] text-gray-950"
                >
                  Run a real jobsite.
                  <br />
                  <em
                    className="not-italic"
                    style={{ color: "#C0C0BC" }}
                  >
                    Before it&apos;s real.
                  </em>
                </h1>

                <p className="animate-fade-up delay-200 mt-7 text-lg text-gray-500 max-w-md leading-relaxed">
                  SiteCommand is a training ground for construction project
                  management. Take command of a real project in a safe
                  sandbox — the same tools, inbox, and pressure as the job,
                  with a coach in your corner and no way to get fired.
                </p>

                {/* CTAs */}
                <div className="animate-fade-up delay-300 mt-10 flex flex-wrap items-center gap-3">
                  <a
                    href="/signup?plan=starter"
                    className="group relative inline-flex items-center px-7 py-3.5 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
                    style={{ background: "#111110" }}
                  >
                    <span className="relative z-10">Start training free</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 hover:border-gray-300 hover:bg-white hover:text-gray-900 active:scale-[0.98]"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                  >
                    See how it works
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </a>
                </div>

                {/* Social proof — reframed for training */}
                <div className="animate-fade-up delay-400 mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 pt-10 border-t border-gray-100">
                  {[
                    { k: "70", v: "guided lessons" },
                    { k: "1", v: "full project to run" },
                    { k: "24/7", v: "AI coach & counterparties" },
                  ].map((item) => (
                    <div key={item.v} className="flex items-baseline gap-1.5">
                      <span className="font-display text-lg text-gray-900 tabular-nums">
                        {item.k}
                      </span>
                      <span className="text-xs text-gray-400">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Product preview — a live "training day" ── */}
              <div className="hidden lg:block animate-scale-in delay-200">
                <Bezel size="md" elevation="lifted">
                  <div>
                    {/* Training banner strip (mirrors the real amber banner) */}
                    <div
                      className="px-5 py-2.5 flex items-center justify-between"
                      style={{
                        background: "#FEF3C7",
                        borderBottom: "1px solid rgba(180,83,9,0.18)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#B45309" }}
                        />
                        <span
                          className="text-[10px] font-semibold tracking-wide uppercase"
                          style={{ color: "#92400E" }}
                        >
                          SiteCommand Training
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "#B45309" }}>
                        Kane Hall Renovation
                      </span>
                    </div>

                    {/* Day header */}
                    <div
                      className="px-5 py-3.5 border-b flex items-center justify-between"
                      style={{ borderColor: "rgba(0,0,0,0.05)" }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg text-gray-950">
                          Day 14
                        </span>
                        <span className="text-xs text-gray-400">
                          Foundations & Site Utilities
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                        style={{ color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                      >
                        Phase 2 of 6
                      </span>
                    </div>

                    {/* Task list */}
                    <div className="px-5 py-4 space-y-2.5">
                      {[
                        { t: "Review the grading release from the civil engineer", chip: "Site", done: true },
                        { t: "Issue RFI on the rim / spot-grade conflict", chip: "RFI", done: false },
                        { t: "Chase Bedrock Concrete for the missing lien waiver", chip: "Buyout", done: false },
                      ].map((task) => (
                        <div key={task.t} className="flex items-start gap-2.5">
                          <span
                            className="mt-0.5 w-4 h-4 rounded-[5px] shrink-0 flex items-center justify-center"
                            style={{
                              background: task.done ? "#10B981" : "#FFFFFF",
                              border: task.done ? "1px solid #10B981" : "1.5px solid #D1D5DB",
                            }}
                          >
                            {task.done && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span
                            className={`text-xs flex-1 leading-snug ${task.done ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {task.t}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded text-gray-500 bg-gray-100 shrink-0">
                            {task.chip}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Inbox nudge */}
                    <div className="px-5 pb-4">
                      <div
                        className="rounded-lg px-3 py-2.5 flex items-center gap-2.5"
                        style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)" }}
                      >
                        <span className="text-sm">📬</span>
                        <span className="text-[11px] text-gray-700 leading-tight">
                          <span className="font-semibold">2 new emails</span> — the owner and your switchgear vendor
                        </span>
                      </div>
                    </div>
                  </div>
                </Bezel>

                {/* Floating coach chip — Double-bezel small card */}
                <div className="mt-3 ml-4 inline-flex animate-fade-up delay-500">
                  <Bezel size="sm" elevation="soft">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(212,80,10,0.09)" }}
                      >
                        <svg className="w-4 h-4" style={{ color: "#D4500A" }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                          Message from your coach
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Day 14 briefing · 1:12
                        </p>
                      </div>
                    </div>
                  </Bezel>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section
          className="border-y py-12 px-6 sm:px-10"
          style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FFFFFF" }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="font-display text-3xl text-gray-950 tabular-nums">
                  {s.value}
                </span>
                <span className="text-sm text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-24 px-6 sm:px-10 scroll-mt-16" style={{ background: "#FAFAF9" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 max-w-2xl">
              <div className="mb-4">
                <Eyebrow>How it works</Eyebrow>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950">
                Reps, not lectures.
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                You don&apos;t watch a course — you show up and run the project.
                Everything that happens on a real job happens here, on a schedule
                you can&apos;t fully control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {steps.map((step) => (
                <Bezel key={step.n} size="md" elevation="flat" className="h-full" innerClassName="h-full">
                  <div className="h-full p-7 flex flex-col gap-4">
                    <span
                      className="font-display text-3xl tabular-nums"
                      style={{ color: "#C0C0BC" }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </Bezel>
              ))}
            </div>
          </div>
        </section>

        {/* ── What you'll actually do — bento of real capabilities ── */}
        <section className="py-24 px-6 sm:px-10" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="mb-4">
                  <Eyebrow>The experience</Eyebrow>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Large: Run a real project */}
              <div className="md:col-span-2">
                <Bezel size="md" elevation="flat" className="h-full" innerClassName="h-full">
                  <div className="h-full p-7 flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <FeatureIcon color="#2563EB" path="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 4h16M9 4v16" />
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                          Run a real, sandboxed project
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                          RFIs, submittals, commitments & buyout, change events,
                          budget, daily logs — the production tools, seeded with a
                          full directory and a live project. Nothing is faked, and
                          nothing you do can break the real world.
                        </p>
                      </div>
                    </div>
                    {/* Mini tool strip */}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      {["RFIs", "Submittals", "Commitments", "Change Events", "Budget", "Daily Logs", "Emails"].map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md text-gray-600"
                          style={{ background: "#F5F5F4", border: "1px solid rgba(0,0,0,0.05)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Bezel>
              </div>

              {/* Small: Living inbox */}
              <FeatureCard
                color="#6366F1"
                iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                title="A living inbox"
                desc="The owner, vendors, and accounting email you on a schedule. Reply and they reply back — realistically, in character."
              />

              {/* Small: AI coach */}
              <FeatureCard
                color="#D4500A"
                iconPath="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12M8 9v6l-4-3 4-3z"
                title="An AI coach in your ear"
                desc="A spoken briefing at the start of every day tells you what matters and why — narrated, not buried in a manual."
              />

              {/* Large: Interactive meetings */}
              <div className="md:col-span-2">
                <Bezel size="md" elevation="flat" className="h-full" innerClassName="h-full">
                  <div className="h-full p-7 flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <FeatureIcon color="#111110" path="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                          Sit in on real meetings
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                          Attend the preconstruction bid review as a live conversation.
                          The estimator and project executive talk; when the floor comes
                          to you, you answer. You&apos;re scored on the issues you catch —
                          the long-lead switchgear, the steel scope gap, the price hold.
                        </p>
                      </div>
                    </div>
                    {/* Mini transcript */}
                    <div className="mt-auto space-y-2 pt-2">
                      <div className="flex gap-2 items-start">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0 pt-0.5">Rachel · Est.</span>
                        <span className="text-[11px] text-gray-600 rounded-lg px-2.5 py-1.5 bg-gray-50 leading-snug">
                          Steel came in low, but I think there&apos;s a scope gap on connections…
                        </span>
                      </div>
                      <div className="flex gap-2 items-start justify-end">
                        <span className="text-[11px] text-white rounded-lg px-2.5 py-1.5 leading-snug" style={{ background: "#111110" }}>
                          Let&apos;s hold the award until we level that. What&apos;s the switchgear lead time?
                        </span>
                        <span className="text-[10px] font-semibold w-10 shrink-0 pt-0.5" style={{ color: "#D4500A" }}>You · PM</span>
                      </div>
                    </div>
                  </div>
                </Bezel>
              </div>

              {/* Small: Day by day */}
              <FeatureCard
                color="#0EA5E9"
                iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="Day by day, start to finish"
                desc="A 70-day build across six phases — tasks, phone calls, and end-of-day checks that arrive whether you're ready or not."
              />

              {/* Small: Milestone reviews */}
              <FeatureCard
                color="#10B981"
                iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                title="Milestone job reviews"
                desc="At each phase, an AI performance review scores your decisions, flags what you missed, and exports to PDF."
              />

              {/* Small: Curriculum */}
              <FeatureCard
                color="#F59E0B"
                iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                title="A 70-lesson curriculum"
                desc="The workflows and the construction knowledge behind them — deep-linked from the exact day you're living through."
              />
            </div>
          </div>
        </section>

        {/* ── Curriculum tracks ── */}
        <section className="py-24 px-6 sm:px-10" style={{ background: "#FAFAF9" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 max-w-2xl">
              <div className="mb-4">
                <Eyebrow>The curriculum</Eyebrow>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950">
                Learn the craft,
                <br />
                then run the job
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Seventy hand-written lessons across seven tracks — from how to
                read a drawing set to how MEP sequencing drives your schedule.
                Read ahead, or open the one your day just handed you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.map((track) => (
                <Bezel key={track.name} size="md" elevation="flat" className="h-full" innerClassName="h-full">
                  <div className="h-full p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{track.name}</h3>
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full tabular-nums"
                        style={{ color: "#1D4ED8", background: "#EFF6FF" }}
                      >
                        {track.count} lessons
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{track.desc}</p>
                  </div>
                </Bezel>
              ))}
              {/* Total tile */}
              <Bezel size="md" elevation="flat" className="h-full" innerClassName="h-full">
                <div className="h-full p-6 flex flex-col justify-center gap-1" style={{ background: "#111110", borderRadius: 14 }}>
                  <span className="font-display text-4xl text-white tabular-nums">70</span>
                  <span className="text-sm text-gray-400">lessons, and counting</span>
                </div>
              </Bezel>
            </div>
          </div>
        </section>

        {/* ── Who it's for ── */}
        <section className="py-16 px-6 sm:px-10" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <h2 className="font-display text-2xl sm:text-3xl text-gray-950 shrink-0 md:max-w-[14rem]">
              Built for anyone stepping onto the job.
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {audiences.map((a) => (
                <span
                  key={a}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full"
                  style={{ background: "#F5F5F4", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          className="py-28 px-6 sm:px-10"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}
        >
          <div className="max-w-7xl mx-auto">
            <Bezel size="xl" elevation="flat">
              <div className="px-10 py-20 text-center relative overflow-hidden">
                {/* Subtle ambient gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,80,10,0.04) 0%, transparent 70%)",
                  }}
                />

                <div className="relative">
                  <div className="mb-6">
                    <Eyebrow>Your first day starts now</Eyebrow>
                  </div>

                  <h2
                    className="font-display text-4xl sm:text-5xl md:text-6xl text-gray-950 leading-tight"
                  >
                    Ready to run your
                    <br />
                    first project?
                  </h2>

                  <p className="mt-5 text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
                    Launch a sandbox, open your inbox, and take command — no
                    experience required, no way to get it wrong for real.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="/signup?plan=starter"
                      className="group relative inline-flex items-center px-8 py-4 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
                      style={{ background: "#111110" }}
                    >
                      <span className="relative z-10">Start training free</span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200" />
                    </a>
                    <a
                      href="/login"
                      className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]"
                    >
                      I already have an account
                    </a>
                  </div>
                </div>
              </div>
            </Bezel>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6 sm:px-10"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="font-display text-sm text-gray-900">
            SiteCommand
          </span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-400">
            <a href="/signup?plan=starter" className="hover:text-gray-700 transition-colors">
              Start training
            </a>
            <a href="/pricing" className="hover:text-gray-700 transition-colors">
              Pricing
            </a>
            <a href="/demo" className="hover:text-gray-700 transition-colors">
              Demo
            </a>
            <a href="#" className="hover:text-gray-700 transition-colors">
              Privacy policy
            </a>
            <a href="#" className="hover:text-gray-700 transition-colors">
              Terms of service
            </a>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} SiteCommand
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Rounded icon tile used across feature cards. */
function FeatureIcon({ color, path }: { color: string; path: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${color}12` }}
    >
      <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
      </svg>
    </div>
  );
}

/** Standard (single-column) feature tile. */
function FeatureCard({
  color,
  iconPath,
  title,
  desc,
}: {
  color: string;
  iconPath: string;
  title: string;
  desc: string;
}) {
  return (
    <Bezel size="md" elevation="flat" className="h-full" innerClassName="h-full">
      <div className="h-full p-7 flex flex-col gap-4">
        <FeatureIcon color={color} path={iconPath} />
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Bezel>
  );
}
