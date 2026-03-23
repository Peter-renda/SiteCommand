"use client";

import { useState } from "react";
import Link from "next/link";

type NavSubItem = { label: string; href: string };

type SolutionsProduct = { label: string; description: string; href: string };
type SolutionsCapabilityColumn = { heading: string; items: NavSubItem[] };

const solutionsProducts: SolutionsProduct[] = [
  { label: "Project Execution", description: "Build with confidence from start to finish", href: "#" },
  { label: "Cost Management", description: "Take control of your project financials", href: "#" },
  { label: "Resource Management", description: "Optimize every crew, hour, and piece of equipment", href: "#" },
];

const solutionsCapabilities: SolutionsCapabilityColumn[] = [
  {
    heading: "Preconstruction",
    items: [
      { label: "Bid Management", href: "#" },
      { label: "BIM", href: "#" },
      { label: "Estimating", href: "#" },
      { label: "Prequalification", href: "#" },
    ],
  },
  {
    heading: "Construction",
    items: [
      { label: "Project Management", href: "/solutions/project-management" },
      { label: "Quality & Safety", href: "/solutions/quality-and-safety" },
      { label: "Schedule", href: "/solutions/schedule" },
      { label: "RFI", href: "/solutions/rfi" },
    ],
  },
  {
    heading: "Financials",
    items: [
      { label: "Budget Management", href: "#" },
      { label: "Invoice Management", href: "#" },
      { label: "Project Financials", href: "#" },
      { label: "Time Tracking", href: "#" },
    ],
  },
  {
    heading: "Platform",
    items: [
      { label: "Analytics", href: "#" },
      { label: "Document Management", href: "#" },
      { label: "Equipment", href: "#" },
      { label: "Workforce Management", href: "#" },
    ],
  },
];

const navItems: { label: string; items: NavSubItem[]; href?: string }[] = [
  {
    label: "Solutions",
    items: [], // handled separately via mega-menu
  },
  {
    label: "About Us",
    items: [
      { label: "Company", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "#" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Community", href: "#" },
    ],
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
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpen(item.label)}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-all duration-150"
                onClick={() =>
                  item.items.length === 0 && item.label !== "Solutions"
                    ? (window.location.href = item.href ?? "#")
                    : setOpen(open === item.label ? null : item.label)
                }
              >
                {item.label}
                {(item.items.length > 0 || item.label === "Solutions") && (
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
                  className="fixed left-0 right-0 mt-1 bg-white border-t border-gray-200 shadow-xl"
                  style={{ top: "64px" }}
                >
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Products section */}
                    <p className="text-xs font-semibold tracking-wide text-gray-400 mb-5">Products</p>
                    <div className="grid grid-cols-3 gap-6 mb-10">
                      {solutionsProducts.map((product) => (
                        <a key={product.label} href={product.href} className="group flex flex-col gap-1 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                          <span className="font-semibold text-gray-900 group-hover:text-gray-700">
                            {product.label} →
                          </span>
                          <span className="text-sm text-orange-500">{product.description}</span>
                        </a>
                      ))}
                    </div>

                    {/* Featured Capabilities section */}
                    <p className="text-xs font-semibold tracking-wide text-gray-400 mb-5">Featured capabilities</p>
                    <div className="grid grid-cols-4 gap-6 mb-6">
                      {solutionsCapabilities.map((col) => (
                        <div key={col.heading}>
                          <p className="font-semibold text-gray-900 mb-3">{col.heading}</p>
                          <ul className="space-y-2">
                            {col.items.map((item) => (
                              <li key={item.label}>
                                <a href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                  {item.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <a href="#" className="text-sm font-medium text-gray-900 hover:underline">
                      View more capabilities →
                    </a>
                  </div>
                </div>
              )}

              {/* Standard dropdown */}
              {item.label !== "Solutions" && item.items.length > 0 && open === item.label && (
                <div
                  className={`absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 ${item.sections ? "w-[580px]" : "w-44"}`}
                >
                  {item.items.map((sub) => (
                    <a
                      key={sub.label}
                      href={sub.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Login — always visible */}
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-950 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
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
              {item.items.length === 0 && item.label !== "Solutions" ? (
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
                  {open === item.label && item.label === "Solutions" && (
                    <div className="pl-4 space-y-1 mb-1">
                      {solutionsCapabilities.flatMap((col) => col.items).map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          className="block px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                  {open === item.label && item.label !== "Solutions" && (
                    <div className="pl-4 space-y-1 mb-1">
                      {item.items.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          className="block px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          {sub.label}
                        </a>
                      ))}
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
