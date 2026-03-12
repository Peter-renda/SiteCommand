"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  "course of construction": "bg-green-50 text-green-700",
  "bidding": "bg-blue-50 text-blue-700",
  "pre-construction": "bg-yellow-50 text-yellow-700",
  "post-construction": "bg-gray-100 text-gray-600",
  "warranty": "bg-purple-50 text-purple-700",
};

export default function ContractorClient({ username }: { username: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/contractor/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  function selectProject(p: Project) {
    setOpen(false);
    setQuery(p.name);
    router.push(`/projects/${p.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Project selector */}
      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Select a Project</h1>
        <p className="text-sm text-gray-400 mb-6">
          {loading ? "Loading your projects..." : `${projects.length} project${projects.length === 1 ? "" : "s"} assigned to you`}
        </p>

        <div ref={containerRef} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Type or scroll to find a project..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />

          {/* Dropdown chevron */}
          <button
            type="button"
            onClick={() => { setOpen((v) => !v); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            tabIndex={-1}
          >
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && !loading && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    {projects.length === 0 ? "No projects assigned yet." : "No projects match your search."}
                  </p>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectProject(p)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          {(p.city || p.state) && (
                            <p className="text-xs text-gray-400 mt-0.5">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                        {p.status && (
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {p.status}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
