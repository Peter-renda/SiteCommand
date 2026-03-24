"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: "3D Model Viewer",
    description:
      "View and navigate intelligent 3D building models directly in your browser — no installs, no plugins. Field teams and office staff access the same model from any device.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Clash Detection",
    description:
      "Identify and resolve design conflicts before they become field problems. Run automated clash checks across all model disciplines and track resolution status in one place.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Model Coordination",
    description:
      "Give every discipline — architecture, structural, MEP — a shared coordination environment. Track issues, assign owners, and keep all comments tied directly to model elements.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: "Field Connectivity",
    description:
      "Link BIM data to field tasks, punch lists, and photos. When a worker marks an issue in the field, it snaps directly to the model element — giving you a full picture of project health.",
  },
];

const stats = [
  { value: "30%", label: "of construction work is rework on average — BIM helps eliminate it" },
  { value: "6×", label: "ROI achieved by teams using collaborative BIM processes" },
  { value: "20%", label: "reduction in project costs reported by BIM-enabled teams" },
];

const faqs = [
  {
    question: "What is BIM?",
    answer:
      "Building Information Modeling (BIM) is a 3D model-based process that gives architecture, engineering, and construction professionals insights and tools to more efficiently plan, design, construct, and manage buildings and infrastructure. It combines technology, digital representations, and collaborative workflows into comprehensive building models that contain both geometric and non-geometric data.",
  },
  {
    question: "What is BIM used for?",
    answer:
      "BIM serves as a central platform for construction project management and collaboration. Teams use it to facilitate coordination between disciplines, manage project documentation, detect design conflicts before construction begins, perform accurate cost estimation, and handle project scheduling — all from a single source of truth.",
  },
  {
    question: "How does BIM reduce rework?",
    answer:
      "By virtually building the project before breaking ground, BIM lets teams identify clashes, coordination gaps, and design errors in the model rather than on the jobsite. Resolving these issues digitally is orders of magnitude cheaper than fixing them after concrete is poured or walls are framed.",
  },
  {
    question: "Who needs access to BIM models?",
    answer:
      "Everyone involved in delivering the project benefits from access — architects, engineers, GC project managers, subcontractor foremen, and owners. SiteCommand's browser-based viewer means field crews can pull up the model on a tablet without any special software.",
  },
  {
    question: "What file formats does SiteCommand BIM support?",
    answer:
      "SiteCommand supports the most common BIM formats including IFC, RVT (Revit), NWD/NWC (Navisworks), and DWG. Models can be uploaded directly or synced via our integrations with Autodesk and other design platforms.",
  },
];

export default function BIMPage() {
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
            BIM for construction management
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Revolutionize your projects with BIM that's simple, intuitive, and designed to unlock collaboration for everyone, everywhere — from the design table to the jobsite.
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

      {/* Stats bar */}
      <section className="py-16 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.value}>
              <p className="text-5xl font-bold text-gray-900 mb-2">{s.value}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is BIM */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is BIM?</h2>
          <p className="text-lg text-gray-500 leading-relaxed mb-6">
            Building Information Modeling (BIM) is a 3D model-based process that gives architecture, engineering, and construction professionals insights and tools to more efficiently plan, design, construct, and manage buildings and infrastructure.
          </p>
          <p className="text-lg text-gray-500 leading-relaxed">
            This intelligent approach combines technology, digital representations, and collaborative workflows to create comprehensive building models that contain both geometric and non-geometric data about the project — enabling every stakeholder to work from a single source of truth.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Build with confidence</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              SiteCommand BIM connects your models, your team, and your project data — so every decision is grounded in the most current information.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow"
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

      {/* How BIM is transforming construction */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How BIM is transforming construction</h2>
          <p className="text-lg text-gray-500 leading-relaxed mb-6">
            BIM transforms construction by fundamentally changing how projects are planned, executed, and managed. The technology enables teams to virtually build and optimize structures before construction begins, significantly reducing the rework that accounts for roughly 30% of total project cost on traditional builds.
          </p>
          <p className="text-lg text-gray-500 leading-relaxed">
            Connected to SiteCommand's project management, documents, and financial tools, BIM data becomes actionable across every phase — from early design through final closeout. Owners get real-time visibility, GCs reduce surprises, and subcontractors arrive on site knowing exactly what to build.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
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
          <h2 className="text-3xl font-bold mb-4">Ready to build smarter?</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Give every member of your team — from the design studio to the field — access to the same intelligent model.
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
