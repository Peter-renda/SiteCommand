import Navbar from "../components/Navbar";
const plans = [
  {
    name: "Starter",
    price: "$99",
    description: "Perfect for small crews and single-project teams.",
    features: ["Up to 10 team members", "Daily logs", "Documents", "RFIs & Submittals"],
  },
  {
    name: "Professional",
    price: "$199",
    description: "Built for growing contractors managing multiple projects.",
    features: ["Up to 99 team members", "Everything in Starter", "Advanced reporting", "Directory"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions for large organizations.",
    features: ["Unlimited team members", "Priority support", "Custom integrations", "SLA"],
  },
];
export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">Choose the plan that fits your team.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 flex flex-col ${plan.highlight ? "border-gray-900 shadow-xl" : "border-gray-200"}`}>
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-gray-500">/mo</span>}
              </div>
              <p className="text-gray-500 mb-8 text-sm">{plan.description}</p>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={`/signup?plan=${plan.name.toLowerCase()}`} className={`block text-center py-3 rounded-lg font-medium transition-colors ${plan.highlight ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-gray-50 text-gray-900 hover:bg-gray-100"}`}>
                Get started
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
