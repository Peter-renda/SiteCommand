import Navbar from "../../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    name: "Inspections & Checklists",
    description:
      "Build custom inspection templates once and deploy them across every project. Field teams complete checklists on their phone — results are logged instantly with photos and GPS.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    name: "Incident Reporting",
    description:
      "Log near-misses, injuries, and property damage from the field the moment they happen. Auto-route reports to the right people and maintain a complete OSHA-ready record.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    name: "Observations",
    description:
      "Capture positive and negative observations on-site with photos and notes. Assign corrective actions with due dates so nothing falls through the cracks.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    name: "Toolbox Talks",
    description:
      "Schedule, deliver, and document safety meetings digitally. Collect attendee signatures on-site and store a time-stamped record for every talk — no paper forms required.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    name: "Non-Conformance Reports",
    description:
      "Flag quality defects the moment they're found. Attach drawings, photos, and spec references, then track each NCR from open to resolved with a full audit trail.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    name: "Quality Reports & Analytics",
    description:
      "See inspection pass rates, open NCRs, and incident trends across all your projects in one dashboard. Spot patterns early and prove compliance to owners and insurers.",
  },
];

const stats = [
  { value: "62%", label: "fewer recordable incidents on average" },
  { value: "3×", label: "faster inspection turnaround" },
  { value: "89%", label: "of teams catch defects before closeout" },
  { value: "100%", label: "digital — no paper, no lost forms" },
];

const faqs = [
  {
    q: "Can I build my own inspection templates?",
    a: "Yes. SiteCommand's template builder lets you create custom checklists for any trade or inspection type. Start from a blank slate or clone an existing template and adapt it for your project.",
  },
  {
    q: "Are incident reports OSHA-compliant?",
    a: "Incident reports capture all fields required by OSHA 300/301 logs. You can export a ready-to-file report at any time. We recommend reviewing with your safety officer before submission.",
  },
  {
    q: "Can subcontractors complete inspections and observations?",
    a: "Yes. External collaborators invited to a project can be granted permission to complete checklists, submit observations, and attend toolbox talks — without accessing other projects or company data.",
  },
  {
    q: "How do non-conformance reports connect to drawings?",
    a: "When you create an NCR, you can pin it directly to a location on the current drawing set. The pin stays linked to the latest revision so the field always has the right context.",
  },
  {
    q: "Is there a history of all quality and safety activity?",
    a: "Every inspection, observation, incident, and NCR is time-stamped and attributed to a user. The full activity log is always available and can be exported for owner or insurer review.",
  },
];

export default function QualityAndSafetyPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-start justify-center min-h-[90vh] px-6 sm:px-10 max-w-7xl mx-auto">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(212,80,10,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-3xl pt-32 pb-20">
          <span className="inline-block text-xs font-semibold tracking-wide text-orange-700 bg-orange-50 border border-orange-100 rounded px-2.5 py-1 mb-8">
            Construction · Quality &amp; Safety
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-950 leading-[1.05]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Build safer.<br />
            <span className="text-gray-400">Deliver quality.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-500 max-w-xl leading-relaxed">
            Catch defects before they become rework and prevent incidents before
            they happen — with inspections, observations, and reporting built
            for the field.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/pricing"
              className="px-7 py-3.5 text-sm font-semibold text-white bg-gray-950 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              Get started free
            </Link>
            <Link
              href="/demo"
              className="px-7 py-3.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150"
            >
              See a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-gray-100 bg-gray-950 py-16 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span
                className="text-4xl font-bold text-white"
                style={{ letterSpacing: "-0.03em" }}
              >
                {s.value}
              </span>
              <span className="text-sm text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Intro paragraph */}
      <section className="py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="text-4xl font-bold text-gray-950 leading-tight mb-6"
              style={{ letterSpacing: "-0.02em" }}
            >
              Understand, predict,<br />and correct — in real time.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              Quality and safety issues rarely appear without warning. SiteCommand
              gives your team the tools to capture observations the moment they
              happen, route them to the right people, and close them out before
              they escalate into rework, delays, or injuries.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed">
              From pre-pour inspections to final punch lists, every check is
              documented, time-stamped, and tied to the right drawing or spec
              — so you always have proof of what was verified and when.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 space-y-4">
            {[
              "Custom inspection templates for any trade or phase",
              "Field-ready on any mobile device or browser",
              "Role-based access for owners, subs & inspectors",
              "Automatic routing of corrective actions",
              "Full audit trail for every observation and incident",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-orange-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">
            Core capabilities
          </p>
          <h2
            className="text-3xl font-bold text-gray-950 mb-14"
            style={{ letterSpacing: "-0.02em" }}
          >
            Everything you need to protect your people and your project
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.name}
                className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-3 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{f.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">
            How it works
          </p>
          <h2
            className="text-3xl font-bold text-gray-950 mb-14 max-w-lg"
            style={{ letterSpacing: "-0.02em" }}
          >
            From first inspection to final sign-off
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Set up your safety program",
                body: "Create inspection templates, configure incident categories, and assign roles. Bring subs and inspectors into the project with the right level of access.",
              },
              {
                step: "02",
                title: "Capture issues in the field",
                body: "Complete checklists, log observations, and report incidents from a phone — with photos, GPS, and drawing pins — the moment something is found.",
              },
              {
                step: "03",
                title: "Resolve and report with confidence",
                body: "Auto-route corrective actions, track NCRs to closure, and export a clean safety and quality record for owners, insurers, or regulators.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-4">
                <span className="text-xs font-bold text-orange-400 tracking-widest">{item.step}</span>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="border-t border-gray-100 bg-orange-50 py-16 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2
              className="text-2xl font-bold text-gray-950 mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              See SiteCommand on your next project
            </h2>
            <p className="text-sm text-gray-500">
              Schedule a 20-minute walkthrough with our team. No slides — just
              live software on a real project.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap shrink-0">
            <Link
              href="/demo"
              className="px-7 py-3.5 text-sm font-semibold text-white bg-gray-950 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              Request a demo
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 text-sm font-semibold text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-150"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">
            FAQ
          </p>
          <h2
            className="text-3xl font-bold text-gray-950 mb-12"
            style={{ letterSpacing: "-0.02em" }}
          >
            Common questions
          </h2>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-100 bg-gray-950 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-6">
          <h2
            className="text-4xl font-bold text-white max-w-xl leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Build safer projects, starting today
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Join hundreds of contractors who've moved from paper forms and
            email chains to one platform built for the field.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <Link
              href="/pricing"
              className="px-7 py-3.5 text-sm font-semibold text-gray-950 bg-white rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all duration-150"
            >
              Get started free
            </Link>
            <Link
              href="/demo"
              className="px-7 py-3.5 text-sm font-semibold text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              Request a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-10 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="text-sm font-semibold text-white">SiteCommand</span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-500">
            <a href="/pricing" className="hover:text-gray-300 transition-colors">Pricing</a>
            <a href="/demo" className="hover:text-gray-300 transition-colors">Demo</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of service</a>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} SiteCommand</p>
        </div>
      </footer>
    </div>
  );
}
