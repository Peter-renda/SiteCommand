import Link from "next/link";
import Navbar from "../components/Navbar";
import { caseStudies } from "./data";
import ROICalculator from "./roi-calculator";

function ConstructionPlaceholder() {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-t-xl">
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
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

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-3">
            Case Studies
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 max-w-2xl">
            Real results from real job sites
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl">
            General contractors, developers, and specialty subcontractors are using SiteCommand to
            close projects faster, cut administrative overhead, and protect their margins.
          </p>
        </div>

        {/* Case study cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {caseStudies.map((study) => (
            <div
              key={study.slug}
              className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all flex flex-col"
            >
              <ConstructionPlaceholder />

              <div className="p-6 flex flex-col flex-1">
                <div className="mb-3">
                  <span className="inline-block text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5">
                    {study.companyType}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {study.headlineStat}
                  </p>
                  <p className="text-sm text-gray-500">{study.headlineStatLabel}</p>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">
                  {study.shortDescription}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{study.companyName}</p>
                    <p className="text-xs text-gray-400">{study.location}</p>
                  </div>
                  <Link
                    href={`/case-studies/${study.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    Read case study →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <ROICalculator />

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Ready to see results like these?
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
            Join contractors who have replaced spreadsheets and email threads with a single platform
            built for how construction actually works.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
