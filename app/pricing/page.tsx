import Navbar from "../components/Navbar";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever free",
    description: "For individuals and small teams getting started.",
    features: [
      "Up to 3 sites",
      "Basic analytics",
      "Document storage (1 GB)",
      "Community support",
    ],
    cta: "Get started free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing teams that need more power and flexibility.",
    features: [
      "Unlimited sites",
      "Advanced analytics & reporting",
      "Document storage (50 GB)",
      "Priority email support",
      "Custom integrations",
      "Team collaboration tools",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations with complex requirements.",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated account manager",
      "SLA & uptime guarantee",
      "SSO & advanced security",
      "Custom contracts & billing",
    ],
    cta: "Contact sales",
    href: "#",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
          Pricing
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 max-w-2xl mx-auto">
          Simple, transparent pricing
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          No hidden fees. No surprises. Pick the plan that fits your team and
          scale as you grow.
        </p>
      </section>

      {/* Plans */}
      <section className="py-12 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "border-gray-100 text-gray-900"
              }`}
            >
              <div className="mb-6">
                <p
                  className={`text-sm font-medium mb-2 ${
                    plan.highlighted ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm mb-1 ${
                      plan.highlighted ? "text-gray-400" : "text-gray-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    plan.highlighted ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-white" : "text-gray-400"
                      }`}
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
                    <span
                      className={plan.highlighted ? "text-gray-300" : "text-gray-600"}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-white text-gray-900 hover:bg-gray-100"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Have questions?
        </h2>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          Our team is happy to help you find the right plan for your needs.
        </p>
        <a
          href="#"
          className="mt-6 inline-block px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
        >
          Talk to us
        </a>
      </section>
    </div>
  );
}
