import Navbar from "../components/Navbar";
import Link from "next/link";

const values = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Built in the field",
    body: "Our founders spent years running construction projects before writing a single line of code. We know what a busy jobsite actually looks like.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Priced for real contractors",
    body: "Enterprise software vendors charge enterprise prices. We don't. Simple, transparent plans — no hidden fees, no seat minimums, no sales calls to get a number.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Simple by design",
    body: "The best idea is often the simplest one. We strip out everything that doesn't directly help a GC run a better project — so your team actually uses the software.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-start justify-center min-h-[70vh] px-6 sm:px-10 max-w-7xl mx-auto">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(212,80,10,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl pt-32 pb-20">
          <span className="inline-block text-xs font-semibold tracking-wide text-orange-700 bg-orange-50 border border-orange-100 rounded px-2.5 py-1 mb-8">
            About SiteCommand
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-950 leading-[1.05]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Software built by<br />
            <span className="text-gray-400">people who build.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-500 max-w-xl leading-relaxed">
            We started SiteCommand because we got tired of paying too much for
            software that was too complicated. There's a better way — and it
            starts with keeping things simple.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-gray-100 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">Our mission</p>
            <h2
              className="text-4xl font-bold text-gray-950 leading-tight mb-6"
              style={{ letterSpacing: "-0.02em" }}
            >
              Save general contractors<br />$1 billion — together.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              Construction software has gotten expensive, bloated, and
              complicated. GCs are paying for features they'll never use and
              seats they don't need — just to manage a project that's already
              hard enough.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed">
              We believe the best software is the software your whole crew
              actually uses. SiteCommand is built to be simple enough for the
              field, powerful enough for the office, and priced so it pays for
              itself on the first project.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-950 p-10 flex flex-col gap-6">
            <div>
              <span
                className="text-5xl font-bold text-white block mb-2"
                style={{ letterSpacing: "-0.03em" }}
              >
                $1B
              </span>
              <span className="text-gray-400 text-sm">our goal — saved by contractors switching to SiteCommand</span>
            </div>
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-300 text-base leading-relaxed">
                "Sometimes the best idea is the simplest one. We don't need
                more features — we need software that gets out of the way and
                lets contractors build."
              </p>
              <p className="mt-4 text-sm text-gray-500">— SiteCommand founding team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">
            What we believe
          </p>
          <h2
            className="text-3xl font-bold text-gray-950 mb-14"
            style={{ letterSpacing: "-0.02em" }}
          >
            Three ideas that drive everything we build
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  {v.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-4">
            Our story
          </p>
          <h2
            className="text-3xl font-bold text-gray-950 mb-8"
            style={{ letterSpacing: "-0.02em" }}
          >
            We've been on your jobsite.
          </h2>
          <div className="space-y-5 text-lg text-gray-500 leading-relaxed">
            <p>
              SiteCommand started with a simple frustration: the existing tools
              were either too expensive, too complicated, or built for someone
              else's workflow. General contractors were duct-taping together
              spreadsheets, email threads, and overpriced enterprise platforms
              just to run a single project.
            </p>
            <p>
              We set out to build something different — software that works the
              way a construction project actually works. Fast to set up, easy
              to use in the field, and priced fairly for contractors of every
              size.
            </p>
            <p>
              Our goal is straightforward: help GCs save money without
              sacrificing the visibility, accountability, and documentation
              they need to build great projects and protect their business.
            </p>
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
            Ready to simplify your next project?
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
