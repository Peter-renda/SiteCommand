"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppNavDrawer from "@/app/components/AppNavDrawer";
import { roleLabel, projectTypeLabel } from "@/lib/simulation-constants";

type TrainingProject = {
  id: string;
  name: string;
  training_role: string | null;
  training_project_type: string | null;
  training_day: number | null;
  training_last_saved_at: string | null;
};

type Props = {
  username: string;
  email: string;
  totalLessons: number;
  completedLessons: number;
  projects: TrainingProject[];
};

type Goals = {
  jobTitle: string;
  targetDate: string; // YYYY-MM-DD
  notes: string;
};

const EMPTY_GOALS: Goals = { jobTitle: "", targetDate: "", notes: "" };

function goalsKey(email: string) {
  return `sc-home-goals-${email || "me"}`;
}

/** Whole days from today (local) to the target date; negative if past. */
function daysUntil(target: string): number | null {
  if (!target) return null;
  const [y, m, d] = target.split("-").map(Number);
  if (!y || !m || !d) return null;
  const t = new Date(y, m - 1, d);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t.getTime() - startOfToday.getTime()) / 86_400_000);
}

export default function HomeClient({
  username,
  email,
  totalLessons,
  completedLessons,
  projects,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [goals, setGoals] = useState<Goals>(EMPTY_GOALS);
  const [editingGoals, setEditingGoals] = useState(false);
  const [draft, setDraft] = useState<Goals>(EMPTY_GOALS);

  // Load persisted goals (per user, client-only — no server round trip needed).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(goalsKey(email));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Goals>;
        const next = { ...EMPTY_GOALS, ...parsed };
        setGoals(next);
        setEditingGoals(!next.targetDate && !next.jobTitle && !next.notes);
      } else {
        setEditingGoals(true);
      }
    } catch {
      setEditingGoals(true);
    }
  }, [email]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const remainingLessons = Math.max(0, totalLessons - completedLessons);
  const countdown = useMemo(() => daysUntil(goals.targetDate), [goals.targetDate]);

  const firstName = username.split(/[\s@.]/)[0] || username;
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function startEdit() {
    setDraft(goals);
    setEditingGoals(true);
  }

  function saveGoals() {
    const next: Goals = {
      jobTitle: draft.jobTitle.trim(),
      targetDate: draft.targetDate,
      notes: draft.notes.trim(),
    };
    setGoals(next);
    try {
      localStorage.setItem(goalsKey(email), JSON.stringify(next));
    } catch {
      /* storage may be unavailable — the in-memory value still updates */
    }
    setEditingGoals(false);
  }

  const hasGoals = Boolean(goals.jobTitle || goals.targetDate || goals.notes);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            className="-ml-1.5 p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">CPMA</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors max-w-[140px]"
              title="Resources, Training, Settings, Logout"
            >
              <span className="truncate">{username}</span>
              <svg
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-40">
                <div className="w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <a href="/resources" className="block px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Resources</a>
                  <a href="/training" className="block px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Training</a>
                  <a href="/settings/account" className="block px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Settings</a>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Welcome back, {greeting}</h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s where you stand on your path to landing a project management role.</p>
        </div>

        {/* Top stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Training progress */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Training modules</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{pct}%</span>
              <span className="text-sm text-gray-500">complete</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {completedLessons} of {totalLessons} done
              {remainingLessons > 0 && ` · ${remainingLessons} to go`}
            </p>
            <a href="/training/lessons" className="mt-3 inline-block text-xs font-medium text-emerald-700 hover:text-emerald-800">
              Continue training →
            </a>
          </div>

          {/* Ongoing mock projects */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Mock projects</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{projects.length}</span>
              <span className="text-sm text-gray-500">ongoing</span>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {projects.length === 0
                ? "You haven't launched a training project yet."
                : "Real, private SiteCommand sandboxes you're running."}
            </p>
            <a
              href={projects.length === 0 ? "/training/practice" : "https://www.constructionpmacademy.com/dashboard"}
              className="mt-3 inline-block text-xs font-medium text-indigo-700 hover:text-indigo-800"
            >
              {projects.length === 0 ? "Launch a project →" : "Manage projects →"}
            </a>
          </div>

          {/* Countdown */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Job-search goal</p>
            {goals.targetDate && countdown !== null ? (
              <>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    {countdown >= 0 ? countdown : Math.abs(countdown)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {countdown > 0 ? "days to go" : countdown === 0 ? "the day is here!" : "days past"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Target:{" "}
                  {new Date(`${goals.targetDate}T00:00:00`).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </>
            ) : (
              <>
                <div className="mt-2 text-3xl font-semibold text-gray-300">—</div>
                <p className="mt-3 text-xs text-gray-500">Set a target date below to start the countdown.</p>
              </>
            )}
          </div>
        </div>

        {/* Goals editor */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">My goals</h2>
            {!editingGoals && (
              <button
                type="button"
                onClick={startEdit}
                className="text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Edit
              </button>
            )}
          </div>

          {editingGoals ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target role</label>
                <input
                  value={draft.jobTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, jobTitle: e.target.value }))}
                  placeholder="e.g. Assistant Project Manager"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Land a job by</label>
                <input
                  type="date"
                  value={draft.targetDate}
                  onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes &amp; milestones</label>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="What do you want to accomplish along the way? (e.g. finish all buyout modules, run one full mock project, earn the credential)"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveGoals}
                  className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
                >
                  Save goals
                </button>
                {hasGoals && (
                  <button
                    type="button"
                    onClick={() => setEditingGoals(false)}
                    className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {goals.jobTitle && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Target role</p>
                  <p className="text-sm text-gray-900">{goals.jobTitle}</p>
                </div>
              )}
              {goals.targetDate && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Land a job by</p>
                  <p className="text-sm text-gray-900">
                    {new Date(`${goals.targetDate}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {countdown !== null && (
                      <span className="text-gray-500">
                        {" "}
                        · {countdown > 0 ? `${countdown} days away` : countdown === 0 ? "today" : `${Math.abs(countdown)} days ago`}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {goals.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Notes &amp; milestones</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{goals.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ongoing projects list */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Your mock projects</h2>
            <a href="/training/practice" className="text-xs font-medium text-gray-500 hover:text-gray-900">
              Launch new →
            </a>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">
              No training projects yet. Head to{" "}
              <a href="/training/practice" className="text-indigo-700 hover:text-indigo-800 font-medium">Practice</a>{" "}
              to launch a real, private SiteCommand sandbox and run a job end to end.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {projects.map((p) => (
                <li key={p.id}>
                  <a
                    href={`/projects/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[
                          p.training_role ? roleLabel(p.training_role) : null,
                          p.training_project_type ? projectTypeLabel(p.training_project_type) : null,
                          typeof p.training_day === "number" ? `Day ${p.training_day}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
