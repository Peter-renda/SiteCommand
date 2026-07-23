"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { label: string; href: string };

const navItems: NavItem[] = [
  { label: "Blog", href: "/blog" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "Career Center", href: "/careers" },
  { label: "Get Started", href: "/pricing" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(250,250,249,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(0,0,0,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-10 flex items-center justify-between h-14">
        {/* Logo */}
        <a
          href="https://www.constructionpmacademy.com/"
          className="text-sm sm:text-base font-semibold tracking-tight text-gray-900 hover:opacity-80 transition-opacity shrink-0 whitespace-nowrap"
          style={{ letterSpacing: "-0.01em" }}
        >
          The Construction Project Management Academy
        </a>

        {/* Desktop nav items */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-all duration-150"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Login — plain text link */}
          <Link
            href="/login"
            className="hidden lg:inline text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150"
          >
            Login
          </Link>

          {/* Desktop primary CTA */}
          <Link
            href="/signup"
            className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-md transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#111110" }}
          >
            Start Free Trial
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
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
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
            <Link
              href="/login"
              className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="block px-3 py-2 text-sm font-semibold text-white rounded-md text-center"
              style={{ background: "#111110" }}
              onClick={() => setMobileOpen(false)}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
