import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="min-h-dvh bg-white">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />

      {/* Hero */}
      <main
        id="main-content"
        className="relative flex flex-col items-start justify-center min-h-dvh px-6 sm:px-10 max-w-7xl mx-auto"
      >
        {/* Ambient background gradient */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(212,80,10,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-3xl pt-32 pb-24">
          <span className="inline-block text-xs font-semibold tracking-wide text-orange-700 bg-orange-50 border border-orange-100 rounded px-2.5 py-1 mb-8">
            Built for contractors
          </span>

          <h1
            className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-950 leading-[1.05]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Take command<br />
            <span className="text-gray-400">of your site.</span>
          </h1>

          <p className="mt-8 text-xl text-gray-500 max-w-xl leading-relaxed">
            RFIs, submittals, daily logs, drawings, and schedules — managed in
            one place. Built for contractors who need clarity, not chaos.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/pricing"
              className="px-7 py-3.5 text-sm font-semibold text-white bg-gray-950 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              Get started free
            </a>
            <a
              href="/demo"
              className="px-7 py-3.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150"
            >
              See a demo
            </a>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="pb-16 flex items-center gap-6 flex-wrap">
          <p className="text-xs text-gray-400 font-medium">Trusted by construction teams across the US</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1.5 text-xs text-gray-500">4.9 / 5 from 200+ teams</span>
          </div>
        </div>
      </main>

      {/* Features strip */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-10">
            Everything your crew needs
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-10">
            {[
              { name: "RFI management", desc: "Track requests for information from submittal to resolution." },
              { name: "Submittals", desc: "Manage approvals without chasing emails or lost documents." },
              { name: "Daily logs", desc: "Record manpower, weather, and site activity every day." },
              { name: "Drawing control", desc: "Keep the team on the current set — always." },
              { name: "Schedule tracking", desc: "See where you are versus where you planned to be." },
              { name: "Budget & costs", desc: "Monitor spend against budget before it becomes a problem." },
            ].map((feature) => (
              <div key={feature.name}>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-400">
            <a href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</a>
            <a href="/demo" className="hover:text-gray-700 transition-colors">Demo</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms of service</a>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} SiteCommand</p>
        </div>
      </footer>
    </div>
  );
}
