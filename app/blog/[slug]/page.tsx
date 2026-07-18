import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { INK, ORANGE, LIGHT_BG, MonoTag } from "../../components/blueprint";
import { blogPosts, getPost, formatPostDate } from "../data";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return { title: "Blog — SiteCommand" };
  return { title: `${post.title} — SiteCommand`, description: post.excerpt };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-dvh" style={{ background: LIGHT_BG }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content">
        {/* ── Article header ── */}
        <section className="relative overflow-hidden px-6 sm:px-10 pt-14 pb-10" style={{ background: LIGHT_BG }}>
          <div className="absolute inset-0 sc-bp-grid-light opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase text-gray-400 hover:text-gray-700 transition-colors mb-8">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              All posts
            </Link>

            <div className="flex items-center gap-3 mb-5">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: "rgba(234,88,12,0.08)", color: ORANGE, border: "1px solid rgba(234,88,12,0.18)" }}>
                {post.category}
              </span>
              <span className="font-mono text-[11px] tracking-wide uppercase text-gray-400">
                {formatPostDate(post.date)} · {post.readMinutes} min read
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl text-gray-950 leading-[1.05]">{post.title}</h1>

            <div className="mt-8 flex items-center gap-3 pb-2">
              <span className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-semibold text-white shrink-0" style={{ background: INK }}>
                {initials(post.author)}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                <p className="text-xs text-gray-400">{post.authorRole}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Article body ── */}
        <article className="px-6 sm:px-10 pb-16">
          <div className="max-w-3xl mx-auto">
            {post.body.map((block, i) =>
              block.startsWith("## ") ? (
                <h2 key={i} className="font-display text-2xl text-gray-950 mt-10 mb-3">
                  {block.slice(3)}
                </h2>
              ) : (
                <p key={i} className="text-[17px] text-gray-600 leading-[1.75] mb-5">
                  {block}
                </p>
              )
            )}
          </div>
        </article>

        {/* ── Related + CTA ── */}
        <section className="px-6 sm:px-10 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden" style={{ background: INK }}>
              <div className="relative p-8 sm:p-10">
                <div className="absolute inset-0 sc-bp-grid-dark opacity-70 pointer-events-none" aria-hidden="true" />
                <div className="relative">
                  <MonoTag tone="dark">Put it into practice</MonoTag>
                  <h2 className="font-display text-2xl sm:text-3xl text-white mt-3 leading-tight">
                    Run the real workflows in a sandbox.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Reading is a start. Reps are the job. Launch a sandboxed
                    project and run buyout, RFIs, and change orders for yourself.
                  </p>
                  <a
                    href="/pricing"
                    className="group relative inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all duration-200 active:scale-[0.98]"
                    style={{ background: ORANGE, boxShadow: "0 8px 28px rgba(234,88,12,0.35)" }}
                  >
                    <span className="relative z-10">Start training free</span>
                    <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.14] transition-opacity duration-200" />
                  </a>
                </div>
              </div>
            </div>

            {/* Related posts */}
            <div className="mt-14">
              <div className="mb-6"><MonoTag tone="light">Keep reading</MonoTag></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group block h-full">
                    <div className="sc-card relative h-full flex flex-col bg-white rounded-xl p-6" style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
                      <span className="font-mono text-[10px] tracking-wide uppercase text-gray-400 mb-2">{r.category} · {r.readMinutes} min</span>
                      <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">{r.title}</h3>
                      <span className="mt-4 text-sm font-medium text-gray-900">Read →</span>
                    </div>
                  </Link>
                ))}
              </div>
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
            <Link href="/pricing" className="hover:text-white transition-colors">Sign up</Link>
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
