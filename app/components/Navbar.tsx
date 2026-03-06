"use client";

import { useState } from "react";
import Link from "next/link";

const navItems: { label: string; items: string[]; href?: string }[] = [
  {
    label: "Solutions",
    items: ["Analytics", "Automation", "Integrations", "Security"],
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="https://site-command-orpin.vercel.app/" className="text-lg font-semibold tracking-tight text-gray-900 hover:opacity-80 transition-opacity">
          SiteCommand
        </a>

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

              {item.items.length > 0 && open === item.label && (
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
