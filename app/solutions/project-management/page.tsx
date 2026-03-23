import Navbar from "../../components/Navbar";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    name: "RFI Management",
    description:
      "Create, assign, and track requests for information from open to closed. Every response is logged and tied to the right drawing or spec section — no more lost emails.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    name: "Submittals",
    description:
      "Manage the full submittal workflow — from subcontractor submission to engineer approval — with automatic revision tracking and due-date alerts.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    name: "Schedule Tracking",
    description:
      "Keep the whole team aligned on milestones. Compare planned vs. actual progress, flag delays early, and share live updates without a single spreadsheet.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    name: "Daily Logs",
    description:
      "Record manpower, weather, equipment, and site conditions every day. Create an accurate, time-stamped record that protects you in disputes.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    name: "Drawing Control",
    description:
      "Upload and version control your drawing sets. Everyone in the field sees the current sheet — superseded versions are archived, never deleted.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    name: "Punch Lists",
    description:
      "Build punch lists on-site from your phone. Assign items to subs, attach photos, and mark them complete — all before you leave the jobsite.",
  },
];

const stats = [
  { value: "43%", label: "reduction in RFI response time" },
  { value: "2×", label: "faster closeout documentation" },
  { value: "97%", label: "of teams say fewer missed deadlines" },
  { value: "400+", label: "contractors trust SiteCommand" },
];

const faqs = [
  {
    q: "Does SiteCommand work for small contractors?",
    a: "Yes. SiteCommand is built for contractors of every size. Our Starter plan covers small crews with a single active project. There's no minimum seat count.",
  },
  {
    q: "Can subcontractors and owners access the platform?",
    a: "Absolutely. External collaborators can be invited to a specific project to respond to RFIs and submittals, or given view-only access to relevant sections — without seeing any other project or company data.",
  },
  {
    q: "Is everything accessible in the field without Wi-Fi?",
    a: "SiteCommand is a cloud-first platform that works on any mobile browser. Offline support for daily logs and punch lists is on our near-term roadmap.",
  },
  {
    q: "How does drawing versioning work?",
    a: "When you upload a new drawing revision, the previous version is automatically archived. The field team always sees the current set by default, and you can access any prior revision at any time.",
  },
  {
    q: "Can I migrate my existing RFIs and submittals into SiteCommand?",
    a: "Yes. We offer a guided onboarding process and CSV / Excel import for existing logs. Enterprise customers get a dedicated onboarding specialist.",
  },
];

export default function ProjectManagementPage() {
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
            Construction · Project Management
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-950 leading-[1.05]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Construction project<br />
            <span className="text-gray-400">management software.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-500 max-w-xl leading-relaxed">
            Keep every RFI, submittal, drawing, and schedule in one place so
            your team can stop searching and start building.
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
              Everything connected.<br />Nothing lost.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              Construction projects generate thousands of documents, decisions,
              and conversations. SiteCommand ties them all together — so when
              something changes, everyone knows.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed">
              From the first RFI to final punch list, your team works from a
              single source of truth. No more chasing emails, hunting for
              drawing revisions, or wondering who approved what.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 space-y-4">
            {[
              "Real-time updates for the whole team",
              "Field-ready on any device or browser",
              "Role-based access for owners, subs & inspectors",
              "Full audit trail on every document",
              "Integrates with your existing estimating tools",
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
            All the tools your crew needs in one platform
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
            Visibility from preconstruction to closeout
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Set up your project",
                body: "Create a project, add your team, and upload your drawing set. Invite external collaborators to specific sections without exposing the rest.",
              },
              {
                step: "02",
                title: "Manage in real time",
                body: "Issue RFIs, track submittals, log daily activity, and update the schedule — all from a browser or mobile device, on or off-site.",
              },
              {
                step: "03",
                title: "Close out with confidence",
                body: "Generate a complete audit trail, export punch lists, and hand over a clean document package. Every action is time-stamped and attributed.",
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
            Take command of your next project
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Join hundreds of contractors who've replaced scattered tools with
            one platform built for the field.
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
