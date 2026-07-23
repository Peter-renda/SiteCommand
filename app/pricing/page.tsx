"use client";

import Navbar from "../components/Navbar";

// Every membership includes the same full access — the only difference is the
// billing term (longer commitments save vs. paying monthly).
const features = [
  "Unlimited project simulations",
  "70+ lessons",
  "Career center",
  "Resume help",
  "Resources",
];

// What a free account includes — a limited slice of the program.
const freeFeatures = [
  "Pre-Construction & Entitlements lessons",
  "Resources library",
  "Career Center",
  "Community",
];

const plans = [
  {
    name: "Monthly",
    cadence: "Billed monthly",
    price: "$99",
    period: "/ month",
    save: null,
    description: "Full access, billed month to month. Cancel anytime.",
    cta: "Start training",
    plan: "monthly",
    ctaHref: null,
    highlight: false,
  },
  {
    name: "3 Months",
    cadence: "$83/mo · billed quarterly",
    price: "$250",
    period: "/ 3 months",
    save: "Save $47 vs monthly",
    description: "Commit for a quarter and pay less each month.",
    cta: "Get 3 months",
    plan: "quarterly",
    ctaHref: null,
    highlight: false,
  },
  {
    name: "6 Months",
    cadence: "$67/mo · billed every 6 months",
    price: "$400",
    period: "/ 6 months",
    save: "Save $194 vs monthly",
    description: "The best value for serious career changers.",
    cta: "Get 6 months",
    plan: "biannual",
    ctaHref: null,
    highlight: true,
  },
];

export default function PricingPage() {
  function handleSelectPlan(plan: string) {
    window.location.href = `/signup?plan=${plan}`;
  }

  return (
    <div className="min-h-dvh" style={{ background: "#FAFAF9" }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content" className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        {/* Page title section */}
        <div className="mb-14 animate-fade-up">
          {/* Eyebrow tag */}
          <div className="inline-flex items-center gap-2 mb-4 delay-100">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2563EB" }} />
            <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Get started</span>
          </div>

          <h1
            className="font-display text-5xl text-gray-950 animate-fade-up delay-100"
          >
            Get started
          </h1>
          <p className="mt-4 text-lg text-gray-500 animate-fade-up delay-200">
            Create a free account to start learning, or unlock everything with a membership. Commit for longer and save.
          </p>
        </div>

        {/* Free account — limited access, no card required */}
        <div className="mb-12 animate-fade-up delay-200">
          <div
            className="rounded-2xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
              border: "1px solid rgba(0,0,0,0.055)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
              padding: "1.5px",
            }}
          >
            <div
              className="rounded-[14px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8"
              style={{ background: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
            >
              <div className="sm:flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl text-gray-950">Free account</h2>
                  <span className="font-display text-2xl tabular-nums text-gray-950">$0</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Get a feel for the program with the Pre-Construction &amp; Entitlements lessons,
                  the Resources library, the Career Center, and the Community — free, no card
                  required. Upgrade anytime to unlock the full curriculum, simulations, and your
                  credential.
                </p>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "#2563EB" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="/signup"
                className="shrink-0 text-center py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] hover:opacity-90"
                style={{ background: "#111110", color: "#FFFFFF" }}
              >
                Create free account
              </a>
            </div>
          </div>
        </div>

        <div className="mb-6 animate-fade-up delay-300">
          <h2 className="text-lg font-semibold text-gray-900">Go further with a membership</h2>
          <p className="mt-1 text-sm text-gray-500">
            One membership with everything included. Every plan starts with a 7-day free trial.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-fade-up delay-300">
          {plans.map((plan) => {
            const outerStyle: React.CSSProperties = plan.highlight
              ? {
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
                  border: "1px solid rgba(0,0,0,0.055)",
                  boxShadow:
                    "0 16px 40px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.7) inset",
                  padding: "1.5px",
                  transform: "scale(1.02)",
                }
              : {
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
                  border: "1px solid rgba(0,0,0,0.055)",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
                  padding: "1.5px",
                };

            const innerStyle: React.CSSProperties = {
              background: plan.highlight ? "#FEFCFB" : "#FFFFFF",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            };

            return (
              <div key={plan.name} className="rounded-2xl" style={outerStyle}>
                <div
                  className="h-full rounded-[14px] p-8 flex flex-col"
                  style={innerStyle}
                >
                  {/* Best value badge */}
                  {plan.highlight && (
                    <div className="mb-4">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-[#2563EB] text-white rounded-full">
                        Best value
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-8 min-h-[160px]">
                    <p className="text-xs font-medium tracking-wide mb-1 text-gray-400">
                      {plan.cadence}
                    </p>
                    <h2
                      className="text-2xl text-gray-950"

                    >
                      {plan.name}
                    </h2>
                    <div className="mt-4 flex items-end gap-1">
                      <span
                        className="font-display text-4xl tabular-nums text-gray-950"
                      >
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm mb-1 text-gray-500">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {plan.save && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">
                          {plan.save}
                        </span>
                      </div>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      {plan.description}
                    </p>
                  </div>

                  {/* CTA button */}
                  {plan.ctaHref ? (
                    <a
                      href={plan.ctaHref}
                      className="block text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 mb-8 active:scale-[0.98] hover:opacity-90"
                      style={{
                        background: plan.highlight ? "#FFFFFF" : "#111110",
                        color: plan.highlight ? "#111110" : "#FFFFFF",
                        border: plan.highlight
                          ? "1px solid rgba(0,0,0,0.10)"
                          : "none",
                      }}
                    >
                      {plan.cta}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.plan!)}
                      className="block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 mb-8 active:scale-[0.98] hover:opacity-90"
                      style={{
                        background: plan.highlight ? "#FFFFFF" : "#111110",
                        color: plan.highlight ? "#111110" : "#FFFFFF",
                        border: plan.highlight
                          ? "1px solid rgba(0,0,0,0.10)"
                          : "none",
                      }}
                    >
                      {plan.cta}
                    </button>
                  )}

                  {/* Feature list — identical across every term */}
                  <ul
                    className="space-y-3 pt-8 mt-auto"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg
                          className="w-4 h-4 shrink-0 mt-0.5"
                          style={{ color: "#2563EB" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          All plans include a 7-day free trial.
        </p>
      </main>

      {/* Footer */}
      <footer
        className="py-10 px-6 sm:px-10"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span
            className="text-sm font-semibold text-gray-900"
           
          >
            The Construction Project Management Academy
          </span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-400">
            <a href="/" className="hover:text-gray-700 transition-colors">Home</a>
            <a href="/privacy" className="hover:text-gray-700 transition-colors">Privacy policy</a>
            <a href="/terms" className="hover:text-gray-700 transition-colors">Terms of service</a>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} CPMA</p>
        </div>
      </footer>
    </div>
  );
}
