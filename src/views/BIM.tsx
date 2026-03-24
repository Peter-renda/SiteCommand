import { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: "Virtual Project Optimization",
    description:
      "Build and optimize your project virtually before breaking ground. Catch design issues, sequence trades, and resolve conflicts when they're still cheap to fix — not mid-construction.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Clash Detection",
    description:
      "Automatically identify conflicts between structural, mechanical, electrical, and plumbing systems. Eliminate costly rework caused by coordination errors before they reach the field.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: "Model-Based Cost Estimation",
    description:
      "Link 3D model data directly to your cost estimates. Extract quantities automatically from BIM models to produce more accurate takeoffs and reduce estimation time.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Cross-Team Collaboration",
    description:
      "Give architects, engineers, owners, and field teams a shared 3D model as the single source of truth. Everyone works from the same data — no more siloed files and conflicting versions.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "4D Scheduling",
    description:
      "Attach your project schedule to the 3D model for 4D simulation. Visualize construction sequences over time to improve planning, identify bottlenecks, and communicate the build plan to stakeholders.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Facilities Management",
    description:
      "Carry model data beyond construction into operations. Asset data embedded in the BIM model supports handover and gives facilities teams a digital twin they can rely on for the life of the building.",
  },
];

const stats = [
  { value: "30%", label: "of construction work is rework — BIM reduces it significantly" },
  { value: "2x", label: "faster clash detection vs. manual coordination reviews" },
  { value: "1 model", label: "as the single source of truth for all project stakeholders" },
];

const faqs = [
  {
    question: "What is BIM?",
    answer:
      "Building Information Modeling (BIM) is a 3D model-based process that gives architecture, engineering, and construction (AEC) professionals the tools and insights to plan, design, construct, and manage buildings and infrastructure more efficiently.",
  },
  {
    question: "What is BIM used for in construction?",
    answer:
      "BIM serves as a central platform for project collaboration. Teams use it to create detailed 3D models with embedded project data, detect design clashes before construction, generate accurate quantity takeoffs, simulate construction sequences, and manage facility assets after handover.",
  },
  {
    question: "How does BIM reduce rework?",
    answer:
      "BIM enables design teams to identify and resolve conflicts between building systems (structural, MEP, architectural) in the model before those conflicts become field problems. Addressing coordination issues virtually is a fraction of the cost of fixing them during construction.",
  },
  {
    question: "Who uses BIM software?",
    answer:
      "Architects, structural and MEP engineers, general contractors, subcontractors, owners, and facilities managers all interact with BIM models at different stages of the project lifecycle. SiteCommand makes the model accessible to all stakeholders in a single platform.",
  },
  {
    question: "Do I need special hardware to use BIM?",
    answer:
      "SiteCommand's BIM tools are cloud-based and browser-accessible, so there's no special hardware or software installation required. Field teams can view and interact with models from any device on the job site.",
  },
];

export default function BIM() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full tracking-wider uppercase">
            BIM for Construction Management
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Build with confidence
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Revolutionize your projects with BIM that's simple, intuitive, and designed to unlock collaboration for everyone — from the design team to the field crew.
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

      {/* Stats */}
      <section className="py-16 px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.value}>
              <div className="text-4xl font-bold text-gray-900 mb-2">{s.value}</div>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is BIM */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is BIM?</h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              Building Information Modeling (BIM) is a 3D model-based process that gives every member of the project team — architects, engineers, contractors, and owners — a shared, data-rich representation of the building.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Unlike traditional 2D drawings, a BIM model contains embedded project data: materials, dimensions, costs, schedules, and more. That data travels with the model from design through construction and into facility operations.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-10 flex items-center justify-center aspect-square">
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How BIM transforms your projects
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From early design through handover, BIM gives every stakeholder better data to make better decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-md transition-shadow"
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
          <h2 className="text-3xl font-bold mb-4">See BIM in action</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Discover how SiteCommand's BIM tools help your team catch issues earlier, collaborate better, and build with more confidence.
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
