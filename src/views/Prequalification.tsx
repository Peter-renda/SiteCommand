import { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Create & Send Forms",
    description:
      "Build customizable prequalification questionnaires and distribute them to vendors in minutes. Collect safety records, financial statements, insurance certificates, and references — all in one form.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Review Submissions",
    description:
      "All vendor-submitted qualifications arrive in one organized dashboard. Review documents, flag issues, and request additional information without hunting through email.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Approve or Deny",
    description:
      "Record qualification decisions with supporting notes and documentation. Build an auditable approval history so your team always knows who is cleared for what scope.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: "Centralized Records",
    description:
      "Project teams can instantly see which contractors are approved for specific scopes and trades. No more asking around — qualification status is always current and visible.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    title: "Invite to Bid",
    description:
      "Seamlessly invite approved contractors to bid packages — directly from their prequalification record. No duplication, no re-entry. Qualification and bidding work together.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: "Fully Configurable",
    description:
      "Adjust the questionnaire to match your business requirements. Collect different information for different trade scopes, geographies, or project types — all within the same platform.",
  },
];

const steps = [
  {
    number: "01",
    title: "Build your questionnaire",
    description: "Design a prequalification form tailored to your requirements — safety data, financials, insurance, references, and more.",
  },
  {
    number: "02",
    title: "Send to vendors",
    description: "Distribute the form to your vendor list. Contractors complete it through a simple, self-service portal.",
  },
  {
    number: "03",
    title: "Review submissions",
    description: "All responses arrive in one dashboard. Review documentation, score submissions, and flag items that need follow-up.",
  },
  {
    number: "04",
    title: "Approve qualified contractors",
    description: "Approve, conditionally approve, or deny each vendor. Record decisions with notes for full auditability.",
  },
  {
    number: "05",
    title: "Invite to bid",
    description: "Send approved vendors directly to your bid packages. Qualification and bidding connect seamlessly.",
  },
];

const faqs = [
  {
    question: "Who uses prequalification software?",
    answer:
      "General contractors, construction managers, and owners use prequalification software to vet subcontractors and suppliers before inviting them to bid. Risk, legal, and procurement teams are often involved in the review process.",
  },
  {
    question: "What information is typically collected in prequalification?",
    answer:
      "Common prequalification data includes: business licenses and certifications, financial statements, bonding capacity, insurance certificates, safety records (EMR, OSHA logs), past project references, key personnel, and relevant experience by trade or project type.",
  },
  {
    question: "How does prequalification reduce project risk?",
    answer:
      "Hiring unqualified or financially unstable contractors is one of the most significant risk factors on a construction project. Prequalification ensures you're only inviting contractors who have the experience, capacity, safety record, and financial standing to deliver on their commitments.",
  },
  {
    question: "Can questionnaires be customized for different scopes?",
    answer:
      "Yes. SiteCommand allows you to build different prequalification templates for different trade scopes, project types, or geographies. You collect the right information for each situation without burdening vendors with irrelevant questions.",
  },
  {
    question: "How does prequalification connect to bid management?",
    answer:
      "SiteCommand links prequalification and bid management directly. Once a contractor is approved, you can invite them to a bid package without switching tools or re-entering their information. Qualification status is always visible when you're building your bid list.",
  },
];

export default function Prequalification() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full tracking-wider uppercase">
            Construction Prequalification Software
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Reduce risk by hiring qualified contractors
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Streamline the prequalification process with a single platform for assessing risk, collecting qualifications, and inviting vetted contractors to bid.
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

      {/* Risk callout */}
      <section className="py-16 px-6 border-y border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-600 leading-relaxed">
            Without a structured prequalification process, you risk hiring contractors who lack the experience, financial capacity, or safety culture to deliver. A single bad hire can derail a project — and expose your organization to significant liability.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to qualify better contractors
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From building your first questionnaire to inviting approved vendors to bid, SiteCommand handles the entire prequalification workflow in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-gray-100 rounded-2xl p-7 hover:shadow-md transition-shadow"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The prequalification process, end to end</h2>
            <p className="text-lg text-gray-500">Five steps from first contact to first invite.</p>
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
          <h2 className="text-3xl font-bold mb-4">Start qualifying better contractors today</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Reduce project risk with a structured, centralized prequalification process that connects directly to your bidding workflow.
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
