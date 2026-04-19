import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { caseStudies } from "../data";

export function generateStaticParams() {
  return caseStudies.map((s) => ({ slug: s.slug }));
}

const featureIconMap: Record<string, React.ReactNode> = {
  rfi: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  submittal: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  log: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  ),
  change: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  budget: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  commitments: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  cost: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  external: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  notify: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
};

function HeroPlaceholder() {
  return (
    <div className="w-full h-72 md:h-96 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center rounded-xl">
      <svg
        className="w-16 h-16 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.25}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
        />
      </svg>
    </div>
  );
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const study = caseStudies.find((s) => s.slug === params.slug);
  if (!study) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-16 pb-20">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-10">
          <div className="mb-6">
            <Link
              href="/case-studies"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Case Studies
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5">
              {study.companyType}
            </span>
            <span className="text-xs text-gray-400">{study.location}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2 max-w-3xl">
            {study.companyName}
          </h1>
          <p className="text-lg text-gray-500 mb-8">{study.projectName}</p>

          <HeroPlaceholder />
        </div>

        {/* Stats bar */}
        <div className="bg-gray-50 border-y border-gray-100 py-8 mb-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {study.metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Headline stat */}
          <div className="mb-12 p-8 bg-gray-900 rounded-xl text-white text-center">
            <p className="text-5xl font-bold tracking-tight mb-2">{study.headlineStat}</p>
            <p className="text-gray-300 text-lg">{study.headlineStatLabel}</p>
          </div>

          {/* Challenge */}
          <section className="mb-10">
            <h2 className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-3">
              The Challenge
            </h2>
            <p className="text-gray-700 leading-relaxed">{study.challenge}</p>
          </section>

          {/* Solution */}
          <section className="mb-10">
            <h2 className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-3">
              The Solution
            </h2>
            <p className="text-gray-700 leading-relaxed">{study.solution}</p>
          </section>

          {/* Results */}
          <section className="mb-12">
            <h2 className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-3">
              The Results
            </h2>
            <p className="text-gray-700 leading-relaxed">{study.results}</p>
          </section>

          {/* Pull quote */}
          <blockquote className="border-l-4 border-gray-900 pl-6 py-2 mb-12">
            <p className="text-xl font-medium text-gray-900 leading-snug mb-3">
              &ldquo;{study.quote}&rdquo;
            </p>
            <footer className="text-sm text-gray-500">{study.quoteAuthor}</footer>
          </blockquote>

          {/* Features used */}
          <section className="mb-16">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-5">
              Features Used
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {study.featuresUsed.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-xl text-center hover:border-gray-200 transition-colors"
                >
                  <span className="text-gray-500">
                    {featureIconMap[f.icon] ?? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <p className="text-xs font-medium text-gray-700">{f.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="border border-gray-100 rounded-2xl p-8 text-center bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              See how SiteCommand can work for your team
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Join contractors who have replaced spreadsheets and email threads with a single
              platform built for construction.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Start free trial
              </Link>
              <Link
                href="/case-studies"
                className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                More case studies
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
