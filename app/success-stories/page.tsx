import Link from "next/link";
import Navbar from "../components/Navbar";
import { INK, ORANGE, LIGHT_BG, MonoTag, CornerTicks } from "../components/blueprint";

export const metadata = {
  title: "Success Stories — SiteCommand",
  description:
    "Real people who used SiteCommand to break into construction management — from the field, the classroom, and career changes into the trailer.",
};

type Story = {
  name: string;
  from: string;
  landed: string;
  company: string;
  quote: string;
  stats: { label: string; value: string }[];
};

// Illustrative learner outcomes for the training product. Names/companies are
// representative composites, not real individuals.
const stories: Story[] = [
  {
    name: "Andre Coleman",
    from: "8 years as a framing carpenter",
    landed: "Assistant Project Manager",
    company: "Regional GC · commercial",
    quote:
      "I knew how buildings go together — I just couldn't speak the office language. Running a full project in the sandbox taught me buyout and submittals so I could actually hold my own in an interview. I moved to the trailer in under three months.",
    stats: [
      { label: "First office role", value: "Asst. PM" },
      { label: "Time to hire", value: "11 wks" },
      { label: "Pay change", value: "+34%" },
    ],
  },
  {
    name: "Priya Natarajan",
    from: "Retail management, no construction background",
    landed: "Project Coordinator",
    company: "Multifamily developer",
    quote:
      "No degree in this, no experience — just a career I wanted out of. The lessons plus running a real project gave me something to point to. I walked into the interview and described a build I'd managed end to end.",
    stats: [
      { label: "Prior field", value: "Retail" },
      { label: "Starting pay", value: "$61K" },
      { label: "Degree", value: "None" },
    ],
  },
  {
    name: "Marcus Bell",
    from: "U.S. Army, logistics",
    landed: "Project Engineer",
    company: "National GC · healthcare",
    quote:
      "The military taught me to run complex operations under pressure. SiteCommand translated that into construction terms — RFIs, change events, the schedule. The phase reviews were brutal in the best way; they showed me exactly what I was missing.",
    stats: [
      { label: "Transitioned", value: "Vet → CM" },
      { label: "Time to hire", value: "< 4 mo" },
      { label: "Starting pay", value: "$67K" },
    ],
  },
  {
    name: "Sofia Reyes",
    from: "Communications degree, unrelated field",
    landed: "Project Coordinator",
    company: "Design-build firm",
    quote:
      "I had a degree, just not in anything that pays like this. What got me hired wasn't a certificate — it was being able to talk through a real submittal log and a stalled buyout like I'd done it. Because I had.",
    stats: [
      { label: "Starting pay", value: "$59K" },
      { label: "Projects run", value: "1 full" },
      { label: "Time to hire", value: "9 wks" },
    ],
  },
  {
    name: "Daniel Okafor",
    from: "General laborer, 5 years",
    landed: "Assistant Superintendent",
    company: "Self-perform concrete",
    quote:
      "I was already on site — I wanted the clipboard, not just the shovel. The Building the Work track and running the daily logs and coordination in the sim got me taken seriously for the office track. My super pushed for the promotion.",
    stats: [
      { label: "Moved to", value: "Asst. Super" },
      { label: "Pay change", value: "+29%" },
      { label: "Time", value: "6 mo" },
    ],
  },
  {
    name: "Hannah Weiss",
    from: "CM student, no jobsite experience",
    landed: "Project Engineer",
    company: "Top-ENR general contractor",
    quote:
      "Classes taught me theory; I'd never touched a real RFI or a change order. Running a 70-day build gave me the reps my classmates didn't have. In interviews I could answer 'what would you do' with 'here's what I did.'",
    stats: [
      { label: "Before", value: "Student" },
      { label: "Starting pay", value: "$64K" },
      { label: "Time to hire", value: "On grad" },
    ],
  },
];

const outcomeStats = [
  { value: "< 4 mo", label: "typical time to first role" },
  { value: "$58–72K", label: "common first offers" },
  { value: "No degree", label: "required to start" },
  { value: "1 project", label: "run start to finish" },
];

export default function SuccessStoriesPage() {
  const featured = stories[0];

  return (
    <div className="min-h-dvh" style={{ background: LIGHT_BG }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content">
        {/* ── Header ── */}
        <section className="relative overflow-hidden px-6 sm:px-10 pt-20 pb-14" style={{ background: LIGHT_BG }}>
          <div className="absolute inset-0 sc-bp-grid-light opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div className="mb-4 animate-fade-up"><MonoTag tone="light">Success stories</MonoTag></div>
            <h1 className="font-display text-4xl sm:text-6xl text-gray-950 leading-[1.02] animate-fade-up delay-100">
              From no experience to
              <br />
              <span className="sc-text-orange-grad">running the job.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-500 leading-relaxed animate-fade-up delay-200">
              People come to SiteCommand from the field, the classroom, and
              careers that had nothing to do with construction. What they share:
              they got real reps running a project — and turned that into an offer.
            </p>
          </div>
        </section>

        {/* ── Outcome stat bar ── */}
        <section className="px-6 sm:px-10 pb-14">
          <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden" style={{ background: INK }}>
            <div className="relative">
              <div className="absolute inset-0 sc-bp-grid-dark opacity-70 pointer-events-none" aria-hidden="true" />
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-y-8 p-8 sm:p-10">
                {outcomeStats.map((s, i) => (
                  <div key={s.label} className={`flex flex-col gap-1 px-2 sm:px-6 ${i !== 0 ? "md:border-l" : ""} ${i % 2 !== 0 ? "border-l md:border-l" : ""}`} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <span className="font-display text-3xl sm:text-4xl text-white tabular-nums">{s.value}</span>
                    <span className="font-mono text-[11px] tracking-wide uppercase leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="max-w-6xl mx-auto mt-3 font-mono text-[10px] tracking-wide uppercase text-gray-400">
            Representative learner outcomes · figures reflect typical U.S. entry roles
          </p>
        </section>

        {/* ── Featured story ── */}
        <section className="px-6 sm:px-10 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="sc-card relative rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
              <CornerTicks />
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
                <div className="relative flex flex-col justify-between p-8" style={{ background: "#F5F5F4", borderRight: "1px solid rgba(14,14,12,0.06)" }}>
                  <span className="inline-flex self-start items-center px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-full" style={{ color: ORANGE, background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.18)" }}>
                    Featured
                  </span>
                  <div className="mt-8">
                    <span className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-lg font-semibold text-white" style={{ background: INK }}>
                      {initials(featured.name)}
                    </span>
                    <p className="mt-4 text-lg font-semibold text-gray-950">{featured.name}</p>
                    <p className="text-sm text-gray-500">{featured.from}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.16)" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
                      <span className="text-xs font-semibold text-gray-800">Now: {featured.landed}</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <svg className="w-8 h-8 mb-4" style={{ color: "rgba(234,88,12,0.35)" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                  <p className="text-xl sm:text-2xl text-gray-900 leading-relaxed font-display">{featured.quote}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {featured.stats.map((st) => (
                      <div key={st.label} className="px-4 py-2.5 rounded-xl" style={{ background: "#FAFAF9", border: "1px solid rgba(14,14,12,0.08)" }}>
                        <p className="font-display text-xl text-gray-950 tabular-nums">{st.value}</p>
                        <p className="font-mono text-[10px] tracking-wide uppercase text-gray-400">{st.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Story grid ── */}
        <section className="px-6 sm:px-10 pt-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8"><MonoTag tone="light">More stories</MonoTag></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.slice(1).map((story) => (
                <article key={story.name} className="sc-card relative h-full flex flex-col bg-white rounded-xl p-7" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
                  <CornerTicks />
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-sm font-semibold text-white shrink-0" style={{ background: INK }}>
                      {initials(story.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-950 truncate">{story.name}</p>
                      <p className="text-xs text-gray-400 truncate">{story.from}</p>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.14)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
                    <span className="text-xs font-semibold text-gray-800">{story.landed}</span>
                    <span className="text-xs text-gray-400">· {story.company}</span>
                  </div>

                  <p className="mt-5 text-sm text-gray-600 leading-relaxed flex-1">&ldquo;{story.quote}&rdquo;</p>

                  <div className="mt-6 grid grid-cols-3 gap-2 pt-5" style={{ borderTop: "1px solid rgba(14,14,12,0.06)" }}>
                    {story.stats.map((st) => (
                      <div key={st.label}>
                        <p className="font-display text-lg text-gray-950 tabular-nums leading-none">{st.value}</p>
                        <p className="font-mono text-[9px] tracking-wide uppercase text-gray-400 mt-1 leading-tight">{st.label}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA bookend ── */}
        <section className="relative overflow-hidden px-6 sm:px-10 py-24" style={{ background: INK }}>
          <div className="absolute inset-0 sc-bp-grid-dark pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 pointer-events-none sc-glow"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(234,88,12,0.18) 0%, transparent 68%)" }}
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="mb-6 flex justify-center"><MonoTag tone="dark">Your story starts here</MonoTag></div>
            <h2 className="font-display text-3xl sm:text-5xl text-white leading-tight">
              Write your own.
            </h2>
            <p className="mt-5 text-lg max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              No experience, no degree, no risk. Launch a sandbox project and get
              the reps that turn into an offer.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/signup?plan=starter"
                className="group relative inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all duration-200 active:scale-[0.98]"
                style={{ background: ORANGE, boxShadow: "0 8px 28px rgba(234,88,12,0.4)" }}
              >
                <span className="relative z-10">Start training free</span>
                <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.14] transition-opacity duration-200" />
              </a>
              <Link
                href="/blog"
                className="inline-flex items-center px-8 py-4 text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.98]"
                style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                Read the blog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-6 sm:px-10" style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="font-display text-sm text-white">SiteCommand</span>
          <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/success-stories" className="hover:text-white transition-colors">Success stories</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} SiteCommand
          </p>
        </div>
      </footer>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
