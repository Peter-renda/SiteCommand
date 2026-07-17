import Link from "next/link";
import Navbar from "../components/Navbar";
import { INK, ORANGE, LIGHT_BG, MonoTag, CornerTicks } from "../components/blueprint";
import { blogPosts, formatPostDate } from "./data";

export const metadata = {
  title: "Blog — SiteCommand",
  description:
    "Career advice, industry breakdowns, and the workflows behind running a construction project — for anyone breaking into construction management.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="min-h-dvh" style={{ background: LIGHT_BG }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content">
        {/* ── Header ── */}
        <section className="relative overflow-hidden px-6 sm:px-10 pt-20 pb-14" style={{ background: LIGHT_BG }}>
          <div className="absolute inset-0 sc-bp-grid-light opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div className="mb-4 animate-fade-up"><MonoTag tone="light">Blog</MonoTag></div>
            <h1 className="font-display text-4xl sm:text-6xl text-gray-950 leading-[1.02] animate-fade-up delay-100">
              Field notes for
              <br />
              <span className="sc-text-orange-grad">breaking in.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-500 leading-relaxed animate-fade-up delay-200">
              Straight talk on the construction management career — how to get
              hired, what the job is really like, and the workflows that move a
              project. No fluff, written by people who&apos;ve run the work.
            </p>
          </div>
        </section>

        {/* ── Featured post ── */}
        <section className="px-6 sm:px-10 pb-6">
          <div className="max-w-6xl mx-auto">
            <Link href={`/blog/${featured.slug}`} className="group block">
              <div className="sc-card relative rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
                <CornerTicks />
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Blueprint visual */}
                  <div className="relative min-h-[220px] lg:min-h-[340px] overflow-hidden" style={{ background: INK }}>
                    <div className="absolute inset-0 sc-bp-grid-dark opacity-80 pointer-events-none" aria-hidden="true" />
                    <div
                      className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full pointer-events-none sc-glow"
                      aria-hidden="true"
                      style={{ background: "radial-gradient(circle, rgba(234,88,12,0.22) 0%, transparent 62%)" }}
                    />
                    <div className="relative h-full flex flex-col justify-between p-8">
                      <span className="inline-flex self-start items-center px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase rounded-full" style={{ color: "#F9A03F", background: "rgba(234,88,12,0.16)", border: "1px solid rgba(234,88,12,0.3)" }}>
                        Featured
                      </span>
                      <span className="font-mono text-[42px] sm:text-[64px] leading-none tracking-tight" style={{ color: "rgba(255,255,255,0.14)" }}>
                        {String(featured.readMinutes).padStart(2, "0")}<span className="text-[20px]"> min</span>
                      </span>
                    </div>
                  </div>
                  {/* Copy */}
                  <div className="p-8 lg:p-10 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: "rgba(234,88,12,0.08)", color: ORANGE, border: "1px solid rgba(234,88,12,0.18)" }}>
                        {featured.category}
                      </span>
                      <span className="font-mono text-[11px] tracking-wide uppercase text-gray-400">{formatPostDate(featured.date)}</span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl text-gray-950 leading-tight group-hover:text-gray-700 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-4 text-gray-500 leading-relaxed flex-1">{featured.excerpt}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold text-white shrink-0" style={{ background: INK }}>
                          {initials(featured.author)}
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-gray-900">{featured.author}</p>
                          <p className="text-xs text-gray-400">{featured.authorRole}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">Read →</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Post grid ── */}
        <section className="px-6 sm:px-10 pt-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8"><MonoTag tone="light">Latest</MonoTag></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                  <article className="sc-card relative h-full flex flex-col bg-white rounded-xl p-7" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
                    <CornerTicks />
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: "rgba(234,88,12,0.08)", color: ORANGE, border: "1px solid rgba(234,88,12,0.18)" }}>
                        {post.category}
                      </span>
                      <span className="font-mono text-[10px] tracking-wide uppercase text-gray-400">{post.readMinutes} min</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-2 group-hover:text-gray-700 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">{post.excerpt}</p>
                    <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(14,14,12,0.06)" }}>
                      <span className="text-xs text-gray-400">{formatPostDate(post.date)}</span>
                      <span className="text-sm font-medium text-gray-900">Read →</span>
                    </div>
                  </article>
                </Link>
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
            <div className="mb-6 flex justify-center"><MonoTag tone="dark">Stop reading, start running</MonoTag></div>
            <h2 className="font-display text-3xl sm:text-5xl text-white leading-tight">
              Learn it by doing it.
            </h2>
            <p className="mt-5 text-lg max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Every article here maps to something you can actually run in a
              sandboxed project — RFIs, buyout, change orders, and all.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
              <Link
                href="/success-stories"
                className="inline-flex items-center px-8 py-4 text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.98]"
                style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                See success stories
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
