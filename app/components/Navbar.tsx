"use client";

import { useState } from "react";
import Link from "next/link";

const solutionsCategories = [
  {
    heading: "Project Management",
    items: [
      {
        label: "RFIs & Submittals",
        description: "Manage requests for information and submittals",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: "Scheduling",
        description: "Plan and track project timelines",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        label: "Punch Lists",
        description: "Track and close out punch list items",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: "Field Operations",
    items: [
      {
        label: "Daily Logs",
        description: "Capture daily site activities and manpower",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
      {
        label: "Photos & Drawings",
        description: "Centralize site photos and drawing sets",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        label: "Meetings",
        description: "Record minutes and track action items",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: "Financial Management",
    items: [
      {
        label: "Budgets & Costs",
        description: "Monitor project budgets in real time",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: "Change Orders",
        description: "Manage change events and approvals",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      },
      {
        label: "Commitments",
        description: "Track subcontracts and purchase orders",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
    ],
  },
];

const navItems: { label: string; items: string[]; href?: string }[] = [
  { label: "Solutions", items: ["solutions"] },
  { label: "About Us", items: ["Company", "Team", "Careers", "Press"] },
  { label: "Resources", items: ["Documentation", "Blog", "Case Studies", "Community"] },
  { label: "Pricing", items: [], href: "/pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold tracking-tight text-gray-900 hover:text-gray-700 transition-colors">
          SiteCommand
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => item.items.length > 0 && setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}
                onClick={() =>
                  item.items.length === 0
                    ? (window.location.href = item.href ?? "#")
                    : setOpen(open === item.label ? null : item.label)
                }
              >
                {item.label}
                {item.items.length > 0 && (
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${open === item.label ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Solutions mega-menu */}
              {item.label === "Solutions" && open === "Solutions" && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-6 px-6"
                  style={{ width: "720px" }}
                  onMouseEnter={() => setOpen("Solutions")}
                  onMouseLeave={() => setOpen(null)}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    What we offer
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    {solutionsCategories.map((cat) => (
                      <div key={cat.heading}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                          {cat.heading}
                        </p>
                        <ul className="space-y-1">
                          {cat.items.map((sol) => (
                            <li key={sol.label}>
                              <a
                                href="#"
                                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                              >
                                <span className="mt-0.5 text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0">
                                  {sol.icon}
                                </span>
                                <span>
                                  <span className="block text-sm font-medium text-gray-800 group-hover:text-gray-900">
                                    {sol.label}
                                  </span>
                                  <span className="block text-xs text-gray-500 mt-0.5 leading-snug">
                                    {sol.description}
                                  </span>
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Built for construction teams of all sizes
                    </span>
                    <a
                      href="/pricing"
                      className="text-xs font-medium text-gray-900 hover:underline"
                    >
                      See pricing →
                    </a>
                  </div>
                </div>
              )}

              {/* Generic dropdown for other nav items */}
              {item.label !== "Solutions" && item.items.length > 0 && open === item.label && (
                <div
                  className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1"
                  onMouseEnter={() => setOpen(item.label)}
                  onMouseLeave={() => setOpen(null)}
                >
                  {item.items.map((sub) => (
                    <a
                      key={sub}
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Login */}
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
