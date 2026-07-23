import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import VerifyBanner from "./VerifyBanner";

/**
 * Welcome / onboarding — the first screen a new member sees after signing up.
 *
 * Its job is to frame the whole program before dropping someone into the app:
 * this site takes you from no construction knowledge to running a real job; it
 * teaches both the theory and the practical work; you learn by running real
 * projects and working with architects, owners, and subcontractors; SiteCommand
 * is the software you run every project out of and it closely resembles the
 * tools used across the industry; and the lessons are woven through each
 * project, so there's no need to complete them all up front.
 */

const INK = "#0E0E0C";
const ORANGE = "#EA580C";

const steps = [
  {
    n: "01",
    title: "Learn the theory and the practical work",
    body: "Start from zero. We teach how the industry actually works — owners, GCs, architects, and subs — alongside the hands-on skills: reading drawings and specs, sequencing the trades, and protecting the budget.",
  },
  {
    n: "02",
    title: "Run real projects, just like the real world",
    body: "You don't just read — you take command of a live, sandboxed project and run it day by day. Emails, meetings, RFIs, and change orders land on a real schedule, and the owner, architect, and subcontractors all write back.",
  },
  {
    n: "03",
    title: "Work in SiteCommand — the industry's software",
    body: "Every project runs out of SiteCommand, our construction management software. It closely mirrors the most widely used platforms in the industry, so the tools and workflows you learn here transfer straight to the job.",
  },
  {
    n: "04",
    title: "Lessons come to you, right when you need them",
    body: "The program walks you through the relevant modules across each project — at the moment they matter. No need to finish everything up front; you'll build the knowledge as you go.",
  },
];

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user_type === "external") redirect("/subcontractor");

  let firstName = "";
  let emailVerified = true; // default true so a lookup failure never nags
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("users")
      .select("first_name, email_verified")
      .eq("id", session.id)
      .maybeSingle();
    firstName = (data?.first_name ?? "").trim();
    emailVerified = data?.email_verified ?? true;
  } catch {
    // Non-fatal — greeting just falls back to a generic welcome.
  }

  return (
    <div className="min-h-dvh" style={{ background: "#FAF9F6" }}>
      {/* Dark hero */}
      <div className="relative overflow-hidden" style={{ background: INK }}>
        <div className="absolute inset-0 sc-bp-grid-dark pointer-events-none" aria-hidden="true" />
        <div
          className="absolute -top-40 right-0 w-[42rem] h-[42rem] rounded-full pointer-events-none"
          aria-hidden="true"
          style={{ background: "radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 62%)" }}
        />
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 pt-16 pb-14">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span className="w-2 h-2 shrink-0" style={{ background: ORANGE }} />
            Welcome aboard
          </span>
          <h1 className="font-display mt-6 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] text-white">
            {firstName ? `Welcome, ${firstName}.` : "Welcome to CPMA."}
            <br />
            <span className="sc-text-orange-grad">From zero to running the job.</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
            The Construction Project Management Academy is built to take you from no
            construction knowledge to confidently running a project — teaching both the
            theory and the practical work, and giving you real reps in the software the
            industry actually uses.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
        {!emailVerified && <VerifyBanner email={session.email} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative bg-white rounded-xl p-6"
              style={{ border: "1px solid rgba(14,14,12,0.09)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-semibold text-white mb-4"
                style={{ background: ORANGE, boxShadow: "0 4px 14px rgba(234,88,12,0.35)" }}
              >
                {s.n}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 rounded-xl p-7 sm:p-8" style={{ background: "#FFFFFF", border: "1px solid rgba(14,14,12,0.09)" }}>
          <h2 className="font-display text-2xl text-gray-950">Ready to run your first project?</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xl">
            Launch a real, sandboxed project and take command — pick your role and project
            type, and your coach will walk you through day one. Prefer to read first? Start
            with the curriculum, or head to your dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/training/practice"
              className="group relative inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg overflow-hidden transition-all active:scale-[0.98]"
              style={{ background: ORANGE, boxShadow: "0 8px 24px rgba(234,88,12,0.3)" }}
            >
              <span className="relative z-10">Launch your first project</span>
              <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.14] transition-opacity" />
            </Link>
            <Link
              href="/training/lessons"
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all active:scale-[0.98] text-gray-800"
              style={{ border: "1px solid rgba(14,14,12,0.14)" }}
            >
              Browse the curriculum
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Go to dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
