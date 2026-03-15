"use client";

import Navbar from "../components/Navbar";

const roles = [
  {
    title: "Head of Growth",
    description:
      "Owns sales and marketing together. Finds customers, closes them, and builds the pipeline.",
  },
  {
    title: "Lead Engineer",
    description:
      "Your right hand on the product. Ships features, maintains the platform, and helps define the technical roadmap.",
  },
  {
    title: "Customer Success Lead",
    description:
      "Makes sure every customer gets value fast and stays long term.",
  },
  {
    title: "Construction Industry Advisor",
    description:
      "A seasoned GC or PM who lends credibility, opens doors, and keeps the product grounded in how the industry actually works.",
  },
  {
    title: "Operations & Finance Manager",
    description:
      "Handles the business side so nothing falls through the cracks as you scale.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Careers</h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl">
            We&apos;re building the construction management platform that contractors actually want
            to use. If that sounds like something you want to be part of, we&apos;d love to hear
            from you.
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.title}
              className="border border-gray-100 rounded-xl px-6 py-5 flex items-start justify-between gap-6 hover:border-gray-200 transition-colors"
            >
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">{role.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>
              </div>
              <a
                href={`mailto:careers@sitecommand.com?subject=Application: ${encodeURIComponent(role.title)}`}
                className="shrink-0 px-3 py-1.5 border border-gray-200 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Apply
              </a>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-gray-400">
          Don&apos;t see your role?{" "}
          <a
            href="mailto:careers@sitecommand.com"
            className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            Reach out anyway.
          </a>
        </p>
      </main>
    </div>
  );
}
