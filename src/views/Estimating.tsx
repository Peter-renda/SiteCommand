import { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "More Accurate Estimates",
    description:
      "Eliminate manual, error-prone calculations and spreadsheets. Pull quantities directly from drawings and BIM models for estimates you can trust going into every project.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: "All-in-One Workflow",
    description:
      "Extract quantities from drawings, access built-in cost catalogs, and build your estimate — all in one connected solution. No switching between apps, no reconciling data across systems.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    title: "Win More Work",
    description:
      "Build competitive, accurate proposals faster. Multiple takeoff methods — 2D, 3D model-based, and automated area — let you match your process to the project and submit more bids without sacrificing precision.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Faster Handoffs",
    description:
      "Seamlessly transition estimate data into your construction execution workflow. No re-entry, no lost context — your budget, schedule, and scope move with the project from preconstruction to the field.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload drawings or BIM models",
    description: "Import PDFs, CAD files, or BIM models. SiteCommand parses your documents and prepares them for takeoff.",
  },
  {
    number: "02",
    title: "Run your takeoff",
    description: "Use automated area, linear, or 3D model-based takeoff tools to extract quantities quickly and accurately.",
  },
  {
    number: "03",
    title: "Build your estimate",
    description: "Apply unit costs from the built-in catalog or your own database. Assemble line items into a complete project estimate.",
  },
  {
    number: "04",
    title: "Submit your proposal",
    description: "Generate a formatted proposal with one click. Win more projects with professional, accurate submissions.",
  },
  {
    number: "05",
    title: "Hand off to construction",
    description: "Push your estimate directly to the project budget. Your preconstruction work carries forward — nothing starts from scratch.",
  },
];

const faqs = [
  {
    question: "Who uses construction estimating software?",
    answer:
      "Estimators, project managers, and preconstruction teams at general contractors and specialty subcontractors use estimating software. It's most valuable for teams that regularly bid competitive projects or need to build detailed cost models during the design phase.",
  },
  {
    question: "What is a construction takeoff?",
    answer:
      "A construction takeoff (or quantity takeoff) is the process of measuring and listing all the materials and labor required to complete a project, based on the drawings and specifications. The output feeds directly into the cost estimate.",
  },
  {
    question: "What are the key steps in construction estimating?",
    answer:
      "The core steps are: (1) review scope and drawings, (2) perform quantity takeoff, (3) apply unit costs, (4) account for overhead and profit, (5) prepare and review the estimate, (6) submit the proposal, (7) handle clarifications, and (8) finalize the award and hand off to execution.",
  },
  {
    question: "How does estimating connect to project execution?",
    answer:
      "SiteCommand connects the estimating and budget modules. Once a project is awarded, your estimate becomes the project budget — no re-entry required. Cost codes, line items, and quantities carry through to the field, keeping preconstruction and construction aligned.",
  },
  {
    question: "Can estimating software integrate with BIM models?",
    answer:
      "Yes. SiteCommand's estimating tools can ingest BIM models and extract quantities automatically, reducing manual takeoff time and improving accuracy. This is especially powerful for complex MEP and structural scopes.",
  },
];

export default function Estimating() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full tracking-wider uppercase">
            Construction Takeoff &amp; Estimating Software
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Reduce rework, protect your margins, and win more profitable work
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Align on scope and cost from day one by streamlining takeoffs, estimates, and proposals in one connected solution.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/signup"
              className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              From takeoff to award in one platform
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Manual spreadsheets and disconnected tools cost you time, margin, and projects. SiteCommand connects every step of the estimating process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 mb-5">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The estimating workflow, simplified</h2>
            <p className="text-lg text-gray-500">Five steps from drawing to construction — without leaving the platform.</p>
          </div>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-8 items-start bg-white rounded-2xl border border-gray-100 p-7">
                <div className="text-3xl font-bold text-gray-200 shrink-0 w-12 leading-none">{step.number}</div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-4 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Win more work. Protect your margins.</h2>
          <p className="text-gray-400 mb-10 text-lg">
            See how SiteCommand's estimating tools help preconstruction teams build faster, more accurate proposals.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/signup"
              className="px-6 py-3 text-sm font-medium text-gray-900 bg-white rounded-md hover:bg-gray-100 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 text-sm font-medium text-white border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
