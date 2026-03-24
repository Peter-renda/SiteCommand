"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: "More Accurate Estimates",
    description:
      "Gain peace of mind going into projects by eliminating manual, error-prone calculations and spreadsheets. Embedded cost catalogs and historical data keep your numbers grounded in reality.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "All-in-One Workflow",
    description:
      "Extract quantities directly from drawings and data-rich BIM models, access embedded cost catalogs, and create estimates — then push them to a project budget in one connected solution.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    title: "Win More Work Quickly",
    description:
      "Build accurate construction cost estimates and win more projects in less time. Choose from a variety of takeoff methods — 3D takeoff, automated area takeoff, linear takeoff, and more.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Handoff Projects Faster",
    description:
      "Seamlessly transition from estimating to course of construction without switching between multiple applications. Your estimate becomes your budget — no re-entry, no version drift.",
  },
];

const steps = [
  {
    number: "01",
    title: "Perform digital takeoff",
    description:
      "Import drawings or connect BIM models to extract quantities automatically. Measure linear, area, and 3D elements directly on screen — no printing, no manual counting.",
  },
  {
    number: "02",
    title: "Build your estimate",
    description:
      "Apply labor, material, and equipment costs from your embedded cost catalog. Layer in overhead and margin, run alternates, and produce a polished proposal ready to submit.",
  },
  {
    number: "03",
    title: "Convert to budget and build",
    description:
      "When you win the job, push your estimate to the project budget with one click. Cost codes, line items, and structure carry over automatically — ready for the first commitment.",
  },
];

const faqs = [
  {
    question: "Who uses preconstruction estimating software?",
    answer:
      "For estimators who struggle with maintaining accurate and efficient project cost estimation, SiteCommand Estimating is an all-in-one solution that streamlines the estimation process, minimizes errors, and connects preconstruction data seamlessly to the construction phase.",
  },
  {
    question: "What are the features and benefits of estimating software?",
    answer:
      "Key benefits include more accurate estimates (eliminating manual spreadsheet errors), an all-in-one workflow (takeoff, estimate, and budget in one solution), winning more work quickly (multiple takeoff methods including 3D, automated area, and linear), and faster project handoff (seamless transition from estimating to construction without switching applications).",
  },
  {
    question: "Can SiteCommand Estimating integrate with other tools?",
    answer:
      "Yes. SiteCommand's platform is designed to connect everyone in construction on one platform, including connections to BIM tools, accounting systems, and other construction software. Open API access is available for custom integrations.",
  },
  {
    question: "What are the steps in construction estimating?",
    answer:
      "Construction cost estimating typically follows eight key steps: reviewing the bid package, performing a site visit, conducting digital takeoff, applying unit costs from a cost catalog, pricing labor and equipment, adding subcontractor quotes, layering in overhead and general conditions, and finally accounting for profit margin and contingency.",
  },
  {
    question: "How does estimating connect to the project budget?",
    answer:
      "SiteCommand links estimating and budgeting. When you win a project, your estimate converts to a project budget in one step — cost codes, quantities, and line items carry over so you start construction with a clean, accurate baseline without any re-entry.",
  },
];

export default function EstimatingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full tracking-wider uppercase">
            Preconstruction
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Construction takeoff &amp; estimating software
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Align on scope and cost from day one by streamlining takeoffs, estimates, and proposals in one connected solution. Reduce rework, protect your margins, and win more profitable work.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              href="/pricing"
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
              Reduce rework, protect your margins, and win more profitable work
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Replace disconnected spreadsheets and manual takeoffs with a unified estimating platform purpose-built for how construction teams work.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500">
              From the first drawing to the final proposal — a connected process that gets you to bid day faster.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-6xl font-bold text-gray-100 mb-3 leading-none">{step.number}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to estimate smarter?</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join estimating teams that have cut bid prep time and built stronger margins with connected takeoff and estimating tools.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 text-sm font-medium text-gray-900 bg-white rounded-md hover:bg-gray-100 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              href="/pricing"
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
