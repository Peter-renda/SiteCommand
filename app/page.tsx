import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Bezel from "./components/Bezel";
import Eyebrow from "./components/Eyebrow";

/**
 * Landing page for SiteCommand Training.
 *
 * The whole site is now a training program — a hands-on sandbox where you run a
 * simulated construction project end to end. Signed-in users skip straight into
 * the training launcher; everyone else gets this landing with sign-in / sign-up.
 */

const features = [
  {
    name: "Practice",
    desc: "Launch a private sandbox project and run it end to end — RFIs, submittals, buyout, budgets, and change orders, with an AI coach guiding each day.",
    accentColor: "#2563EB",
  },
  {
    name: "Lessons",
    desc: "A 70-lesson project-manager curriculum: SiteCommand workflows, reading drawings and specs, site & civil, MEP systems, contracts, and professional skills.",
    accentColor: "#6366F1",
  },
  {
    name: "Guides",
    desc: "Your company's standards, reference documents, and assigned reading — the playbook every new PM should know before they run a job.",
    accentColor: "#10B981",
  },
];

const dayTasks = [
  { label: "Review bid results with preconstruction", done: true },
  { label: "Short-list vendors by trade", done: true },
  { label: "Issue subcontract buyout emails", done: false },
  { label: "Chase the slow electrical sub", done: false },
];

export default async function Home() {
  // The whole site is the training sandbox — a signed-in user never needs the
  // marketing landing; send them straight to the launcher.
  const session = await getSession();
  if (session) redirect("/training/practice");

  return (
    <div className="min-h-dvh" style={{ background: "#FAFAF9" }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* ── Minimal header ── */}
      <header className="px-6 sm:px-10 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <span className="font-display text-lg text-gray-900">
          SiteCommand <span className="text-gray-400">Training</span>
        </span>
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-xl transition-all duration-200 hover:bg-white hover:text-gray-900"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="group relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
            style={{ background: "#111110" }}
          >
            <span className="relative z-10">Create account</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200" />
          </a>
        </div>
      </header>

      <main id="main-content">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-16 pb-20 px-6 sm:px-10">
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 75% 25%, rgba(37,99,235,0.06) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 15% 85%, rgba(37,99,235,0.04) 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px] gap-12 xl:gap-20 items-center">
              {/* ── Left: Copy ── */}
              <div>
                <div className="animate-fade-up mb-8">
                  <Eyebrow>Learn by doing</Eyebrow>
                </div>

                <h1 className="font-display animate-fade-up delay-100 text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.98] text-gray-950">
                  Run a real project.
                  <br />
                  <em className="not-italic" style={{ color: "#C0C0BC" }}>
                    Before it&apos;s real.
                  </em>
                </h1>

                <p className="animate-fade-up delay-200 mt-7 text-lg text-gray-500 max-w-md leading-relaxed">
                  SiteCommand Training gives you a private copy of the platform
                  pre-loaded with a live job — drawings, specs, a subcontractor
                  directory, and an inbox that fills up day by day. Work the whole
                  project like a PM does, with an AI coach and end-of-phase reviews.
                </p>

                <div className="animate-fade-up delay-300 mt-10 flex flex-wrap items-center gap-3">
                  <a
                    href="/signup"
                    className="group relative inline-flex items-center px-7 py-3.5 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
                    style={{ background: "#111110" }}
                  >
                    <span className="relative z-10">Start training</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200" />
                  </a>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 hover:border-gray-300 hover:bg-white hover:text-gray-900 active:scale-[0.98]"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                  >
                    I already have an account
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                <div className="animate-fade-up delay-400 mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 pt-10 border-t border-gray-100 text-sm text-gray-400">
                  <span>Project Manager track</span>
                  <span>70 lessons</span>
                  <span>AI coach &amp; phase reviews</span>
                </div>
              </div>

              {/* ── Right: "Day 1" training panel preview ── */}
              <div className="hidden lg:block animate-scale-in delay-200">
                <Bezel size="md" elevation="lifted">
                  <div>
                    {/* Mock training day header */}
                    <div
                      className="px-5 py-3.5 border-b flex items-center justify-between"
                      style={{
                        borderColor: "rgba(0,0,0,0.05)",
                        background: "rgba(250,250,249,0.9)",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: "#2563EB" }} />
                        <span className="text-xs font-semibold text-gray-700 tracking-wide">
                          Day 1 · Pre-construction
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                        style={{ color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A" }}
                      >
                        Training
                      </span>
                    </div>

                    {/* Mock task list */}
                    <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                      {dayTasks.map((t) => (
                        <div key={t.label} className="px-5 py-3 flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-[5px] shrink-0 flex items-center justify-center"
                            style={{
                              background: t.done ? "#2563EB" : "#FFFFFF",
                              border: t.done ? "1px solid #2563EB" : "1px solid #D1D5DB",
                            }}
                          >
                            {t.done && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-xs flex-1 ${t.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                            {t.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Mock coach footer */}
                    <div
                      className="px-5 py-3 border-t flex items-center gap-3"
                      style={{ borderColor: "rgba(0,0,0,0.05)", background: "rgba(250,250,249,0.7)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(37,99,235,0.08)" }}
                      >
                        🎧
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                          Message from your coach
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          Let&apos;s review the bids and build your short list…
                        </p>
                      </div>
                    </div>
                  </div>
                </Bezel>

                <div className="mt-3 ml-4 inline-flex animate-fade-up delay-500">
                  <Bezel size="sm" elevation="soft">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(16,185,129,0.1)" }}
                      >
                        📬
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                          New email from the owner
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Just now</p>
                      </div>
                    </div>
                  </Bezel>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-24 px-6 sm:px-10" style={{ background: "#FAFAF9" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <span className="eyebrow mb-3">The program</span>
              <h2 className="font-display text-4xl sm:text-5xl text-gray-950 mt-2">
                Everything a new PM
                <br />
                needs to get reps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {features.map((f) => (
                <div key={f.name} className="col-span-1">
                  <Bezel size="md" elevation="flat" className="h-full" innerClassName="h-full">
                    <div className="h-full p-6 flex flex-col gap-4">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${f.accentColor}0f` }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: f.accentColor }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.name}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </Bezel>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-28 px-6 sm:px-10" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <Bezel size="xl" elevation="flat">
              <div className="px-10 py-20 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 70%)",
                  }}
                />
                <div className="relative">
                  <Eyebrow className="mb-6">Get started today</Eyebrow>
                  <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-gray-950 leading-tight">
                    Ready to run your first job?
                  </h2>
                  <p className="mt-5 text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
                    Create an account and launch a training project in under a minute.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="/signup"
                      className="group relative inline-flex items-center px-8 py-4 text-sm font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
                      style={{ background: "#111110" }}
                    >
                      <span className="relative z-10">Create account</span>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200" />
                    </a>
                    <a
                      href="/login"
                      className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]"
                    >
                      Sign in
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
          <span className="font-display text-sm text-gray-900">SiteCommand Training</span>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} SiteCommand
          </p>
        </div>
      </footer>
    </div>
  );
}
