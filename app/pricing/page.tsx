import Navbar from "../components/Navbar";

const plans = [
  {
    name: "Starter",
    size: "1–10 employees",
    price: "$99",
    period: "/ month",
    description: "Perfect for small crews and single-project teams.",
    cta: "Get started",
    ctaHref: "/signup",
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
    description: "Built for growing contractors managing multiple projects.",
    cta: "Get started",
    ctaHref: "/signup",
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
    description: "Custom solutions for large organizations and enterprises.",
    cta: "Contact us",
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
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Choose the plan that fits your team. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-gray-900 bg-gray-900 text-white shadow-xl"
                  : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-white text-gray-900 rounded-full border border-gray-200 shadow-sm whitespace-nowrap">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}>
                  {plan.size}
                </p>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mt-3 text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                  {plan.description}
                </p>
              </div>

              <a
                href={plan.ctaHref}
                className={`block text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors mb-8 ${
                  plan.highlight
                    ? "bg-white text-gray-900 hover:bg-gray-100"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3 mt-auto">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}
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
      </main>
    </div>
  );
}
