"use client";

import Navbar from "../components/Navbar";

const plans = [
  {
    name: "Starter",
    size: "1–10 employees",
    price: "$99",
    period: "/ month",
    description: "For small crews managing a single active project.",
    cta: "Get started",
    plan: "starter" as const,
    ctaHref: null,
    highlight: false,
    features: [
      "Up to 10 team members",
      "Daily logs & manpower tracking",
      "Document & drawing management",
      "RFIs, submittals & punch lists",
      "Photo albums",
      "Email support",
    ],
  },
  {
    name: "Professional",
    size: "11–99 employees",
    price: "$199",
    period: "/ month",
    description: "For growing contractors running multiple projects at once.",
    cta: "Get started",
    plan: "pro" as const,
    ctaHref: null,
    highlight: true,
    features: [
      "Up to 99 team members",
      "Everything in Starter",
      "Multiple active projects",
      "Advanced reporting",
      "Directory & subcontractor management",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    size: "100+ employees",
    price: "Contact sales",
    period: "",
    description: "Custom pricing and configuration for large organizations.",
    cta: "Contact us",
    plan: null,
    ctaHref: "mailto:sales@sitecommand.com",
    highlight: false,
    features: [
      "Unlimited team members",
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SSO & advanced permissions",
      "SLA & enterprise support",
    ],
  },
];

export default function PricingPage() {
  function handleSelectPlan(plan: string) {
    window.location.href = `/signup?plan=${plan}`;
  }

  return (
    <div className="min-h-dvh bg-white">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      <main id="main-content" className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-14">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950" style={{ letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Choose the plan that fits your team. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-2xl border border-gray-200 overflow-hidden">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 ${
                plan.highlight
                  ? "bg-gray-950 text-white"
                  : "bg-white text-gray-900"
              } ${idx < plans.length - 1 ? "md:border-r border-b md:border-b-0 border-gray-200" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute top-6 right-6">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500 text-white rounded">
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan header — fixed height so feature lists align */}
              <div className="mb-8 min-h-[160px]">
                <p className={`text-xs font-medium tracking-wide mb-1 ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}>
                  {plan.size}
                </p>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mt-3 text-sm leading-relaxed ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                  {plan.description}
                </p>
              </div>

              {/* CTA — pinned above features */}
              {plan.ctaHref ? (
                <a
                  href={plan.ctaHref}
                  className={`block text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 mb-8 active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-white text-gray-950 hover:bg-gray-100"
                      : "bg-gray-950 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.plan!)}
                  className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 mb-8 active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-white text-gray-950 hover:bg-gray-100"
                      : "bg-gray-950 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </button>
              )}

              {/* Feature list — starts at same vertical position across all cards */}
              <ul className="space-y-3 border-t border-gray-100/20 pt-8 mt-auto">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-orange-400" : "text-gray-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-gray-300" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-400">
            <a href="/" className="hover:text-gray-700 transition-colors">Home</a>
            <a href="/demo" className="hover:text-gray-700 transition-colors">Demo</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms of service</a>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} SiteCommand</p>
        </div>
      </footer>
    </div>
  );
}
