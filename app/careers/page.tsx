"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary: string | null;
  postedAt: string | null;
  source: string;
  applyUrl: string;
  snippet: string | null;
};

type SearchResponse = {
  jobs: JobListing[];
  providers: { jsearch: boolean; adzuna: boolean };
  configured: boolean;
  errors: string[];
};

const ROLE_CHIPS = [
  "Project Manager",
  "Assistant Project Manager",
  "Project Engineer",
  "Superintendent",
  "Estimator",
  "Field Engineer",
];

const DEFAULT_QUERY = "construction project manager";

function relativeDate(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function sourceBadgeStyle(source: string): { background: string; color: string } {
  const s = source.toLowerCase();
  if (s.includes("linkedin")) return { background: "rgba(10,102,194,0.1)", color: "#0A66C2" };
  if (s.includes("indeed")) return { background: "rgba(37,99,235,0.08)", color: "#2557A7" };
  if (s.includes("ziprecruiter")) return { background: "rgba(22,163,74,0.1)", color: "#15803D" };
  if (s.includes("glassdoor")) return { background: "rgba(13,148,136,0.1)", color: "#0F766E" };
  return { background: "rgba(0,0,0,0.05)", color: "#57534E" };
}

function directSearchLinks(query: string, location: string) {
  const q = encodeURIComponent(query);
  const l = encodeURIComponent(location);
  return [
    { label: "LinkedIn", href: `https://www.linkedin.com/jobs/search/?keywords=${q}${location ? `&location=${l}` : ""}` },
    { label: "Indeed", href: `https://www.indeed.com/jobs?q=${q}${location ? `&l=${l}` : ""}` },
    { label: "ZipRecruiter", href: `https://www.ziprecruiter.com/jobs-search?search=${q}${location ? `&location=${l}` : ""}` },
    { label: "Glassdoor", href: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}` },
  ];
}

const bezelOuter: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
  border: "1px solid rgba(0,0,0,0.055)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
  padding: "1.5px",
  borderRadius: "16px",
};

const bezelInner: React.CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
  borderRadius: "14px",
};

export default function CareerCenterPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState({ query: DEFAULT_QUERY, location: "" });
  const [credential, setCredential] = useState<{ code: string; overall_level: string } | null>(null);
  const requestSeq = useRef(0);

  // If the visitor is a logged-in trainee with an issued credential, surface
  // it — "train → prove → apply" is the whole loop. Silent on 401/errors.
  useEffect(() => {
    fetch("/api/training/credential")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { credential?: { code: string; overall_level: string } | null } | null) => {
        if (body?.credential) setCredential(body.credential);
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback(async (q: string, loc: string, remote: boolean) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q });
      if (loc) params.set("location", loc);
      if (remote) params.set("remote", "1");
      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as SearchResponse;
      if (seq !== requestSeq.current) return; // stale response
      setJobs(data.jobs);
      setConfigured(data.configured);
      setSearched({ query: q, location: loc });
      // A configured provider that returns nothing *and* reported errors means
      // an upstream failure (bad key, exhausted quota, provider outage) — not a
      // genuinely empty result set. Surface that instead of the misleading
      // "No openings matched that search" empty state.
      if (data.configured && data.jobs.length === 0 && data.errors.length > 0) {
        setError("The job boards couldn't be reached right now. Try again in a moment, or use the direct search links below.");
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setError("Couldn't load job listings right now. Try again in a moment, or use the direct search links below.");
      setJobs([]);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(DEFAULT_QUERY, "", false);
  }, [runSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query.trim() || DEFAULT_QUERY, location.trim(), remoteOnly);
  }

  function handleChip(chip: string) {
    const q = `construction ${chip.toLowerCase()}`;
    setQuery(q);
    runSearch(q, location.trim(), remoteOnly);
  }

  const links = directSearchLinks(searched.query, searched.location);

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF9" }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-20">
        {/* Hero */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#EA580C" }} />
            <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Career Center</span>
          </span>
          <h1
            className="font-display text-5xl sm:text-6xl leading-[1.05] mb-5 animate-fade-up"
            style={{ letterSpacing: "-0.03em", color: "#111110", animationDelay: "100ms" }}
          >
            Find your construction management job
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl animate-fade-up" style={{ animationDelay: "200ms" }}>
            Live openings aggregated from LinkedIn, Indeed, Glassdoor, ZipRecruiter, and other
            job boards — filtered for construction project management roles. Train in
            SiteCommand, then land the job.
          </p>
        </div>

        {/* Credential banner (logged-in, certified trainees only) */}
        {credential && (
          <div
            className="mb-6 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            style={{ background: "rgba(21,128,61,0.07)", border: "1px solid rgba(21,128,61,0.18)", color: "#166534" }}
          >
            <span className="font-semibold">✓ SiteCommand Certified — {credential.overall_level}</span>
            <span style={{ color: "rgba(22,101,52,0.75)" }}>
              Include your verification link in applications:
            </span>
            <a
              href={`/verify/${credential.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs underline underline-offset-2"
            >
              /verify/{credential.code}
            </a>
          </div>
        )}

        {/* Search */}
        <div style={bezelOuter} className="animate-fade-up" >
          <form onSubmit={handleSubmit} style={{ ...bezelInner, padding: "20px 24px" }}>
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Role or keywords</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. assistant project manager"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.1)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#EA580C")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, or blank for anywhere"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.1)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#EA580C")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "#EA580C", boxShadow: "0 4px 14px rgba(234,88,12,0.3)" }}
                >
                  {loading ? "Searching…" : "Search"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 mr-2 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Remote only
              </label>
              {ROLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all"
                  style={{ borderColor: "rgba(0,0,0,0.1)", background: "#FFFFFF" }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Aggregation-not-configured notice */}
        {!loading && !configured && (
          <div className="mt-6 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(217,119,6,0.08)", color: "#92400E", border: "1px solid rgba(217,119,6,0.2)" }}>
            Live job aggregation isn&apos;t configured yet (missing job-board API keys). Use the
            direct search links below — they run this exact search on each job board.
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={bezelOuter}>
                  <div style={{ ...bezelInner, padding: "20px 24px" }} className="animate-pulse">
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded mb-3" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <p className="text-xs text-gray-400 mb-4">
                {jobs.length} opening{jobs.length === 1 ? "" : "s"} for &ldquo;{searched.query}&rdquo;
                {searched.location ? ` near ${searched.location}` : ""}
              </p>
              <div className="space-y-4">
                {jobs.map((job) => {
                  const badge = sourceBadgeStyle(job.source);
                  const posted = relativeDate(job.postedAt);
                  return (
                    <div key={job.id} style={bezelOuter}>
                      <div style={{ ...bezelInner, padding: "20px 24px" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h2 className="text-sm font-semibold text-gray-900">{job.title}</h2>
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                                style={badge}
                              >
                                via {job.source}
                              </span>
                              {job.remote && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide" style={{ background: "rgba(37,99,235,0.08)", color: "#1D4ED8" }}>
                                  Remote
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {job.company} · {job.location}
                              {job.salary ? ` · ${job.salary}` : ""}
                              {posted ? ` · posted ${posted}` : ""}
                            </p>
                            {job.snippet && (
                              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{job.snippet}</p>
                            )}
                          </div>
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all whitespace-nowrap"
                          >
                            Apply ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : configured && !error ? (
            <div style={bezelOuter}>
              <div style={{ ...bezelInner, padding: "32px 24px" }} className="text-center">
                <p className="text-sm text-gray-500">
                  No openings matched that search. Try broader keywords or clear the location.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Direct search links */}
        <div className="mt-10">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-3">
            Search directly on
          </p>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white transition-all"
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Work at SiteCommand */}
        <p className="mt-12 text-sm text-gray-400">
          Want to work at SiteCommand itself?{" "}
          <a
            href="mailto:careers@sitecommand.com"
            className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            Reach out.
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 sm:px-10" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
          <div className="flex flex-wrap gap-6 text-xs text-gray-400">
            <a href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms of service</a>
          </div>
          <p className="text-xs text-gray-400">&copy; 2025 SiteCommand</p>
        </div>
      </footer>
    </div>
  );
}
