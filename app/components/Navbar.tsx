"use client";

import { useState } from "react";
import Link from "next/link";

type NavColumn = {
  heading: string;
  items: string[];
};

type NavSection = {
  heading?: string;
  items?: string[];
  columns?: NavColumn[];
};

type NavItem = {
  label: string;
  href?: string;
  sections?: NavSection[];
};

const navItems: NavItem[] = [
  {
    label: "Solutions",
    sections: [
      {
        heading: "PRODUCTS",
        items: [
          "Project Execution",
          "Cost Management",
          "Resource Management",
          "Project Lifecycle Management",
        ],
      },
      {
        heading: "FEATURED CAPABILITIES",
        columns: [
          {
            heading: "Preconstruction",
            items: ["Bid Management", "BIM", "Estimating", "Prequalification"],
          },
          {
            heading: "Construction",
            items: ["Project Management", "Quality & Safety", "Schedule", "RFI"],
          },
          {
            heading: "Financials",
            items: [
              "Budget Management",
              "Invoice Management",
              "Project Financials",
              "Time Tracking",
            ],
          },
          {
            heading: "Platform",
            items: [
              "Analytics",
              "Document Management",
              "Equipment",
              "Workforce Management",
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Who We Serve",
    sections: [
      {
        items: [
          "General Contractors",
          "Specialty Contractors",
          "Owners",
          "Real Estate Developers",
          "Home Builders",
          "Government",
        ],
      },
    ],
  },
  {
    label: "Why SiteCommand",
    sections: [
      {
        items: [
          "Platform Overview",
          "Customer Stories",
          "ROI Calculator",
          "SiteCommand AI",
          "Integrations",
          "Security",
        ],
      },
    ],
  },
  {
    label: "Resources",
    sections: [
      {
        items: [
          "Documentation",
          "Blog",
          "Case Studies",
          "Community",
          "Webinars",
          "Training",
        ],
      },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a
          href="https://site-command-orpin.vercel.app/"
          className="text-lg font-semibold tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
        >
          SiteCommand
        </a>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => item.sections && setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}
                onClick={() =>
                  !item.sections
                    ? (window.location.href = item.href ?? "#")
                    : setOpen(open === item.label ? null : item.label)
                }
              >
                {item.label}
                {item.sections && (
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${open === item.label ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </button>

              {item.sections && open === item.label && (
                <div
                  className={`absolute top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl py-5 ${
                    item.label === "Solutions"
                      ? "left-0 w-[720px]"
                      : "left-0 w-56"
                  }`}
                  onMouseEnter={() => setOpen(item.label)}
                  onMouseLeave={() => setOpen(null)}
                >
                  {item.sections.map((section, i) => (
                    <div key={i} className={i > 0 ? "mt-5 pt-5 border-t border-gray-100" : ""}>
                      {section.heading && (
                        <p className="px-5 mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                          {section.heading}
                        </p>
                      )}

                      {/* Flat item list */}
                      {section.items && (
                        <div className={item.label === "Solutions" ? "grid grid-cols-2 gap-x-4 px-5" : ""}>
                          {section.items.map((sub) => (
                            <a
                              key={sub}
                              href="#"
                              className="block py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              {sub} →
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Column grid */}
                      {section.columns && (
                        <div className="grid grid-cols-4 gap-6 px-5">
                          {section.columns.map((col) => (
                            <div key={col.heading}>
                              <p className="mb-2 text-sm font-semibold text-gray-800">
                                {col.heading}
                              </p>
                              {col.items.map((sub) => (
                                <a
                                  key={sub}
                                  href="#"
                                  className="block py-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                  {sub}
                                </a>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
