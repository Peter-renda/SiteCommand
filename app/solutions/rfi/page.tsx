import Navbar from "../../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    name: "Centralized RFI Log",
    description:
      "Every RFI lives in one searchable, filterable log — open, pending, and closed. No more hunting through inboxes or chasing down who has the ball.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    name: "Email-Based Responses",
    description:
      "Architects and engineers can reply to RFIs directly from their email — no login required. Their response is captured automatically and logged against the RFI.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    name: "Drawing & Spec References",
    description:
      "Pin each RFI to the exact drawing sheet and spec section it relates to. Anyone reading the response always has the right context — no back-and-forth to clarify.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    name: "Due-Date Alerts & Reminders",
    description:
      "Set required response dates and let SiteCommand handle the follow-up. Automatic reminders go out before a deadline is missed — keeping the project moving without manual chasing.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    name: "Cost Impact Tracking",
    description:
      "Flag RFIs with a potential cost impact and convert approved responses into change events in one click. Stay ahead of cost surprises before they hit the budget.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    name: "Full Audit Trail",
    description:
      "Every action — submission, response, revision, and close-out — is time-stamped and attributed. Export the complete RFI log for owner review or dispute resolution.",
  },
];

const stats = [
  { value: "43%", label: "reduction in RFI response time" },
  { value: "0", label: "lost RFIs since teams switched" },
  { value: "3×", label: "faster closeout documentation" },
  { value: "100%", label: "of responses logged automatically" },
];

const faqs = [
  {
    q: "Do architects and engineers need a SiteCommand account to respond?",
    a: "No. External respondents receive an email with the RFI details and can reply directly from their inbox. Their response is captured automatically — no login, no setup required.",
  },
  {
    q: "Can I attach drawings and photos to an RFI?",
    a: "Yes. You can attach any file type — drawings, specs, photos, markups — directly to an RFI. Attachments are stored with the RFI and visible to everyone with project access.",
  },
  {
    q: "How are RFIs linked to drawings?",
    a: "When you create an RFI, you can reference a specific drawing sheet and revision. The link always points to the current revision in SiteCommand's drawing set — so context stays accurate even after updates.",
  },
  {
    q: "Can subcontractors submit RFIs?",
    a: "Yes. Company members and external collaborators with the right permissions can submit RFIs. The project admin controls who can create, respond to, and close out RFIs.",
  },
  {
    q: "How do I handle RFIs that could affect cost?",
    a: "Flag any RFI as a potential cost event when you submit it. Once a response is received and approved, you can convert it to a change event in one click — keeping your budget log up to date.",
  },
];

export default function RFIPage() {
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
            Construction · RFI
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-950 leading-[1.05]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Keep projects moving<br />
            <span className="text-gray-400">with faster RFIs.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-500 max-w-xl leading-relaxed">
            Streamline communication, reduce delays, and turn requests for
            information into action — all without slowing down the field or
            filling anyone's inbox.
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
              Stay organized.<br />Respond faster. Close out clean.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              RFIs scattered across email threads, text messages, and shared
              drives cost projects time and money. SiteCommand keeps every
              request in one searchable log — from submission to response to
              close-out — so nothing gets missed and nothing gets lost.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed">
              External respondents — architects, engineers, owners — can reply
              directly from email without a login. Their answer is captured
              automatically, tied to the right drawing, and visible to everyone
              who needs it.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 space-y-4">
            {[
              "One searchable log for every open and closed RFI",
              "Email-based responses — no login required for architects",
              "Drawing and spec references on every RFI",
              "Automatic due-date reminders to prevent bottlenecks",
              "Full audit trail for closeout and dispute resolution",
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
            Everything you need to manage RFIs from open to closed
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
            From question to answer to action
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Submit the RFI",
                body: "Create an RFI in seconds — attach drawings, specs, or photos, pin it to the relevant drawing location, and set a required response date.",
              },
              {
                step: "02",
                title: "Route and respond",
                body: "SiteCommand notifies the right people automatically. External respondents reply from email — no account needed. Reminders go out if the deadline approaches.",
              },
              {
                step: "03",
                title: "Close out and move on",
                body: "Review the response, distribute it to the team, and close the RFI. Flag any cost impact and convert it to a change event — all from the same screen.",
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
            Stop chasing RFIs. Start building.
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Join hundreds of contractors who've replaced email threads with a
            single RFI log that never loses a response.
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
