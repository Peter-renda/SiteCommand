"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
            SC Admin
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Page content */}
      <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
