import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

const INK = "#0E0E0C";

/**
 * Shared shell for the static legal pages (Privacy, Terms). Renders the marketing
 * Navbar, a readable prose column, and a dark footer whose Privacy/Terms links
 * actually resolve (unlike the `href="#"` placeholders elsewhere).
 */
export default function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#FAF9F6" }}>
      <Navbar />

      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-gray-950">{title}</h1>
          <p className="mt-3 font-mono text-[11px] tracking-wide uppercase text-gray-400">
            Last updated: {lastUpdated}
          </p>
          <div className="sc-legal mt-10">{children}</div>
        </div>
      </main>

      <footer className="py-10 px-6 sm:px-10" style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Link href="/" className="font-display text-sm text-white hover:opacity-80 transition-opacity">
            The Construction Project Management Academy
          </Link>
          <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
            <Link href="/pricing" className="hover:text-white transition-colors">Get Started</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} CPMA
          </p>
        </div>
      </footer>

      <style>{`
        .sc-legal { color: #374151; font-size: 15px; line-height: 1.7; }
        .sc-legal h2 { color: #111110; font-size: 20px; font-weight: 600; margin: 32px 0 10px; }
        .sc-legal h3 { color: #111110; font-size: 16px; font-weight: 600; margin: 20px 0 6px; }
        .sc-legal p { margin: 0 0 14px; }
        .sc-legal ul { margin: 0 0 14px; padding-left: 22px; list-style: disc; }
        .sc-legal li { margin: 4px 0; }
        .sc-legal a { color: #1d6fa5; text-decoration: underline; }
        .sc-legal strong { color: #111110; }
      `}</style>
    </div>
  );
}
