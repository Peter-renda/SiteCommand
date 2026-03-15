"use client";

import { useState } from "react";
import Link from "next/link";

const navItems: { label: string; items?: string[]; sections?: { label: string; items: string[] }[]; href?: string }[] = [
  {
    label: "Solutions",
    sections: [
      { label: "Construction", items: ["Project Management", "Quality & Safety", "Schedule", "RFI"] },
      { label: "Financials", items: ["Budget Management", "Invoice Management", "Project Financials", "Time Tracking"] },
      { label: "Platform", items: ["Analytics", "Document Management", "Equipment", "Workforce Management"] },
    ],
  },
  {
    label: "About Us",
    items: ["Company", "Team", "Careers", "Press"],
  },
  {
    label: "Resources",
    items: ["Documentation", "Blog", "Case Studies", "Community"],
  },
  {
    label: "Pricing",
    items: [],
    href: "/pricing",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a
          href="https://site-command-orpin.vercel.app/"
          className="text-lg font-semibold tracking-tight text-gray-900 hover:opacity-80 transition-opacity shrink-0"
        >
          SiteCommand
        </a>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                onMouseEnter={() => ((item.items?.length ?? 0) > 0 || (item.sections?.length ?? 0) > 0) && setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}
                onClick={() =>
                  (item.items?.length ?? 0) === 0 && (item.sections?.length ?? 0) === 0
                    ? (window.location.href = item.href ?? "#")
                    : setOpen(open === item.label ? null : item.label)
                }
              >
                {item.label}
                {((item.items?.length ?? 0) > 0 || (item.sections?.length ?? 0) > 0) && (
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

              {((item.items?.length ?? 0) > 0 || (item.sections?.length ?? 0) > 0) && open === item.label && (
                <div
                  className={`absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 ${item.sections ? "w-[580px]" : "w-44"}`}
                  onMouseEnter={() => setOpen(item.label)}
                  onMouseLeave={() => setOpen(null)}
                >
                  {item.sections ? (
                    <div className="grid grid-cols-3 gap-0 p-4">
                      {item.sections.map((section) => (
                        <div key={section.label}>
                          <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.label}</p>
                          {section.items.map((sub) => (
                            <a
                              key={sub}
                              href="#"
                              className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                            >
                              {sub}
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    item.items?.map((sub) => (
                      <a
                        key={sub}
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        {sub}
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Login — always visible */}
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
          >
            Login
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <div key={item.label}>
              {(item.items?.length ?? 0) === 0 && (item.sections?.length ?? 0) === 0 ? (
                <a
                  href={item.href ?? "#"}
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <div>
                  <button
                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => setOpen(open === item.label ? null : item.label)}
                  >
                    {item.label}
                  </button>
                  {open === item.label && (
                    <div className="pl-4 space-y-1 mb-1">
                      {item.sections ? (
                        item.sections.map((section) => (
                          <div key={section.label}>
                            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.label}</p>
                            {section.items.map((sub) => (
                              <a key={sub} href="#" className="block px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 transition-colors">{sub}</a>
                            ))}
                          </div>
                        ))
                      ) : (
                        item.items?.map((sub) => (
                          <a
                            key={sub}
                            href="#"
                            className="block px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            {sub}
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
