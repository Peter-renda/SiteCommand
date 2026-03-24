"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: "Digital Applications",
    description:
      "Replace paper questionnaires with structured digital applications. Subcontractors fill out safety records, financial statements, insurance certificates, and references through a branded online portal — no email attachments.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Risk Scoring",
    description:
      "Automatically score each subcontractor application based on EMR, financial strength, bonding capacity, past performance, and safety history. Surface your highest-risk subs before they make it onto the bid list.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Document Management",
    description:
      "Collect, store, and track insurance certificates, W-9s, licenses, and safety programs in one centralized vault. Get automatic alerts when documents are expiring so nothing slips through.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: "Renewal Management",
    description:
      "Track qualification expiry dates across your entire subcontractor database. Automated renewal requests go out before credentials lapse so your approved sub list is always current and compliant.",
  },
];

const steps = [
  {
    number: "01",
    title: "Invite subs to apply",
    description:
      "Send a prequalification invitation to any subcontractor. They receive a branded link to your online portal where they complete the application at their own pace — no account sign-up required.",
  },
  {
    number: "02",
    title: "Review and score",
    description:
      "Applications flow into your dashboard as they're submitted. Automated risk scoring highlights areas of concern. Your team reviews, requests missing documents, and approves or declines — all in one place.",
  },
  {
    number: "03",
    title: "Build a trusted sub list",
    description:
      "Approved subcontractors go directly onto your qualified bidder list. When a new project starts, invite from your pre-vetted roster — confident that every bidder meets your safety and financial requirements.",
  },
];

const stats = [
  { value: "3×", label: "faster qualification process vs. paper-based methods" },
  { value: "60%", label: "reduction in admin time managing sub credentials" },
  { value: "100%", label: "of qualified subs always current — no expired credentials on your bid list" },
];

const faqs = [
  {
    question: "What is subcontractor prequalification?",
    answer:
      "Subcontractor prequalification is the process of evaluating a subcontractor's financial stability, safety record, experience, and insurance coverage before they're invited to bid on a project. It protects the general contractor from awarding work to subs who lack the capacity or qualifications to perform safely and successfully.",
  },
  {
    question: "What information should a prequalification form collect?",
    answer:
      "A thorough prequalification form covers: company background and ownership, financial statements (bonding capacity, credit), safety data (EMR, OSHA recordable rate, incident history), insurance certificates, relevant project experience and references, licenses, and key personnel qualifications.",
  },
  {
    question: "How often should subcontractors be requalified?",
    answer:
      "Most GCs requalify subcontractors annually, though some require requalification at the start of each major project. Insurance certificates typically expire annually and should be tracked continuously. SiteCommand's automated renewal management handles this automatically.",
  },
  {
    question: "Is prequalification required by owners?",
    answer:
      "Many public owners and large private owners require GCs to document subcontractor prequalification processes. On federally funded projects, certain prequalification standards may be mandated. Even when not required, a documented prequalification process is a best practice that reduces project risk.",
  },
  {
    question: "How does prequalification connect to bid management?",
    answer:
      "In SiteCommand, your approved prequalified subcontractors feed directly into the bid management module. When creating a bid package, you invite from your qualified sub list — ensuring that every bidder has already passed your vetting process before they receive scope documents.",
  },
];

export default function PrequalificationPage() {
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
            Subcontractor prequalification software
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Know who you're working with before you award the work. Qualify, vet, and manage your subcontractor roster with a digital process that replaces spreadsheets and email threads.
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

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              A smarter way to vet your subcontractors
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From digital applications to automated renewals, SiteCommand gives you the tools to build and maintain a trusted subcontractor base — at scale.
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
              A straightforward three-step process from invitation to a qualified bidder list.
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
          <h2 className="text-3xl font-bold mb-4">Build a subcontractor base you can trust</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Stop awarding work to subs you haven't vetted. Start every project with a qualified, compliant team.
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
