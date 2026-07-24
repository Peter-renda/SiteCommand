"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
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

type TrackProgress = { key: string; label: string; done: number; total: number };
type Credential = { code: string; overall_level: string; overall_score: number } | null;

type Props = {
  username: string;
  email: string;
  totalLessons: number;
  completedLessons: number;
  completedThisWeek: number;
  tracks: TrackProgress[];
  quizzesTaken: number;
  credential: Credential;
  projects: TrainingProject[];
};

type Goals = {
  jobTitle: string;
  targetMonths: string; // number of months chosen in the dropdown ("" = none)
  targetDate: string; // YYYY-MM-DD, computed from targetMonths when it's chosen
  notes: string;
};

const EMPTY_GOALS: Goals = { jobTitle: "", targetMonths: "", targetDate: "", notes: "" };

/** Timeframe choices (in months) for the "Land a job by" goal. */
const MONTH_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24];

const ORANGE = "#EA580C";

// Shared "bezel" card styling so every card on the page reads as one system —
// matching the Career Center / marketing surfaces.
const bezelOuter: CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
  border: "1px solid rgba(0,0,0,0.055)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
  padding: "1.5px",
  borderRadius: "16px",
};
const bezelInner: CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
  borderRadius: "14px",
};

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

/** Add `months` calendar months to today; returns a YYYY-MM-DD string. */
function addMonthsToToday(months: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Resolve the concrete deadline for a chosen number of months. The date is
 * locked in when the timeframe is first picked (or changed), so editing other
 * goal fields later never pushes the deadline forward; picking a different
 * number of months recomputes it from today.
 */
function resolveTargetDate(months: string, storedMonths: string, storedDate: string): string {
  if (!months) return "";
  if (months === storedMonths && storedDate) return storedDate;
  const n = parseInt(months, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return addMonthsToToday(n);
}

/** Strip the "Training: " prefix so sandbox names read cleanly. */
function cleanProjectName(name: string): string {
  return name.replace(/^training:\s*/i, "").trim() || name;
}

// Time-of-day greeting resolved via useSyncExternalStore so it's SSR-safe: the
// server renders a neutral "Welcome back", then the client swaps in the local
// time-of-day greeting after hydration with no mismatch warning.
const noopSubscribe = () => () => {};
function timeGreetingSnapshot(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** A soft-bezel card wrapper used across the page. */
function Bezel({
  children,
  className = "",
  padClass = "p-5",
  innerClassName = "",
  innerStyle,
}: {
  children: ReactNode;
  className?: string;
  padClass?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}) {
  return (
    <div style={bezelOuter} className={className}>
      <div style={{ ...bezelInner, ...innerStyle }} className={`${padClass} ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

/** A circular progress ring with the percentage in the center. */
function Ring({
  pct,
  size = 76,
  stroke = 7,
  color = "#10B981",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (clamped / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${clamped}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(17,17,16,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-gray-900">{clamped}%</span>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { label: "Training modules", href: "/training/lessons" },
  { label: "Projects", href: "/dashboard" },
  { label: "Career center", href: "/careers" },
  { label: "Skills & credential", href: "/training/skills" },
  { label: "Community", href: "/community" },
];

export default function HomeClient({
  username,
  email,
  totalLessons,
  completedLessons,
  completedThisWeek,
  tracks,
  quizzesTaken,
  credential,
  projects,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [goals, setGoals] = useState<Goals>(EMPTY_GOALS);
  const [editingGoals, setEditingGoals] = useState(false);
  const [draft, setDraft] = useState<Goals>(EMPTY_GOALS);

  // Time-of-day greeting (SSR-safe — neutral on the server, local time on the client).
  const timeGreeting = useSyncExternalStore(noopSubscribe, timeGreetingSnapshot, () => "Welcome back");

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
      targetMonths: draft.targetMonths,
      targetDate: resolveTargetDate(draft.targetMonths, goals.targetMonths, goals.targetDate),
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

  // Live preview of the deadline the chosen timeframe maps to, shown in the editor.
  const previewDate = resolveTargetDate(draft.targetMonths, goals.targetMonths, goals.targetDate);
  const previewDays = previewDate ? daysUntil(previewDate) : null;

  const recent = projects[0];

  // The single most valuable next step, following the program funnel:
  // certified → apply · has a sandbox → resume it · otherwise → launch one.
  const spotlight = (() => {
    if (credential) {
      return {
        eyebrow: "You're certified",
        title: "Time to land the job",
        body: "Your CPMA credential is live. Search live openings and include your verification link with every application.",
        cta: { label: "Search jobs", href: "/careers", newTab: false },
        secondary: recent
          ? { label: `Resume ${cleanProjectName(recent.name)}`, href: `/projects/${recent.id}`, newTab: true }
          : { label: "Keep training", href: "/training/lessons", newTab: false },
      };
    }
    if (recent) {
      const meta = [
        recent.training_project_type ? projectTypeLabel(recent.training_project_type) : null,
        recent.training_role ? roleLabel(recent.training_role) : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        eyebrow: "Jump back in",
        title: `Resume ${cleanProjectName(recent.name)}`,
        body: `Pick up where you left off${
          typeof recent.training_day === "number" ? ` on Day ${recent.training_day}` : ""
        }${meta ? ` of your ${meta} sandbox` : ""}. Running the job end to end is where the real reps are.`,
        cta: { label: "Open project", href: `/projects/${recent.id}`, newTab: true },
        secondary: { label: "Continue training", href: "/training/lessons", newTab: false },
      };
    }
    return {
      eyebrow: "Get started",
      title: "Launch your first mock project",
      body: "Spin up a real, private SiteCommand sandbox and run a construction job from buyout to closeout — the fastest way to build project-management instincts.",
      cta: { label: "Launch a project", href: "/training/practice", newTab: false },
      secondary: { label: "Browse training modules", href: "/training/lessons", newTab: false },
    };
  })();

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF9" }}>
      <AppNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
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
        {/* Hero */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 mb-4 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
            <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Your progress overview</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-gray-900" style={{ letterSpacing: "-0.02em" }}>
              {timeGreeting}, {greeting}
            </h1>
            {credential && (
              <a
                href={`/verify/${credential.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-transform hover:scale-[1.03]"
                style={{ background: "rgba(21,128,61,0.09)", border: "1px solid rgba(21,128,61,0.2)", color: "#166534" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CPMA Certified
              </a>
            )}
          </div>
          <p className="mt-3 text-base text-gray-500 leading-relaxed max-w-2xl animate-fade-up" style={{ animationDelay: "140ms" }}>
            Here&apos;s where you stand on the path from training to a construction project-management role — your learning, your reps, and your goal.
          </p>

          {/* Quick links */}
          <div className="mt-5 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
            {QUICK_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-1.5 rounded-full border text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white transition-all"
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Spotlight — the single most valuable next step */}
        <div className="animate-fade-up mb-8" style={{ animationDelay: "240ms" }}>
          <Bezel
            padClass="p-6 sm:p-7"
            innerStyle={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 62%)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: ORANGE }}>
                  {spotlight.eyebrow}
                </span>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold text-gray-900 truncate">{spotlight.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-xl">{spotlight.body}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <a
                  href={spotlight.cta.href}
                  target={spotlight.cta.newTab ? "_blank" : undefined}
                  rel={spotlight.cta.newTab ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: ORANGE, boxShadow: "0 4px 14px rgba(234,88,12,0.3)" }}
                >
                  {spotlight.cta.label}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            <a
              href={spotlight.secondary.href}
              target={spotlight.secondary.newTab ? "_blank" : undefined}
              rel={spotlight.secondary.newTab ? "noopener noreferrer" : undefined}
              className="mt-4 inline-block text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              {spotlight.secondary.label} →
            </a>
          </Bezel>
        </div>

        {/* Top stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Training progress */}
          <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
            <Bezel className="h-full" innerClassName="h-full flex flex-col">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Training modules</p>
              <div className="mt-3 flex items-center gap-4">
                <Ring pct={pct} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {completedLessons} of {totalLessons}
                  </p>
                  <p className="text-xs text-gray-500">modules complete</p>
                  <p className="mt-1.5 text-xs font-medium">
                    {completedThisWeek > 0 ? (
                      <span className="text-emerald-600">▲ {completedThisWeek} this week</span>
                    ) : (
                      <span className="text-gray-400">{remainingLessons} to go</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                <a href="/training/lessons" className="font-medium text-emerald-700 hover:text-emerald-800">
                  Continue training →
                </a>
                {quizzesTaken > 0 && <span className="text-gray-400">{quizzesTaken} quizzes taken</span>}
              </div>
            </Bezel>
          </div>

          {/* Ongoing mock projects */}
          <div className="animate-fade-up" style={{ animationDelay: "340ms" }}>
            <Bezel className="h-full" innerClassName="h-full flex flex-col">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{ background: "rgba(79,70,229,0.09)", color: "#4338CA" }}
                >
                  <svg className="w-4.5 h-4.5" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                </span>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Mock projects</p>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">{projects.length}</span>
                <span className="text-sm text-gray-500">ongoing</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                {projects.length === 0
                  ? "You haven't launched a training project yet."
                  : "Real, private SiteCommand sandboxes you're running."}
              </p>
              <div className="mt-auto pt-4">
                <a
                  href={projects.length === 0 ? "/training/practice" : "/dashboard"}
                  className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                >
                  {projects.length === 0 ? "Launch a project →" : "Manage projects →"}
                </a>
              </div>
            </Bezel>
          </div>

          {/* Countdown */}
          <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
            <Bezel className="h-full" innerClassName="h-full flex flex-col">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{ background: "rgba(217,119,6,0.1)", color: "#B45309" }}
                >
                  <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Job-search goal</p>
              </div>
              {goals.targetDate && countdown !== null ? (
                <>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-gray-900">
                      {countdown >= 0 ? countdown : Math.abs(countdown)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {countdown > 0 ? "days to go" : countdown === 0 ? "the day is here!" : "days past"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
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
                  <div className="mt-3 text-3xl font-semibold text-gray-300">—</div>
                  <p className="mt-2 text-xs text-gray-500">Set a target date below to start the countdown.</p>
                </>
              )}
              <div className="mt-auto pt-4">
                <a href="#my-goals" className="text-xs font-medium text-amber-700 hover:text-amber-800">
                  {goals.targetDate ? "Update goal →" : "Set your goal →"}
                </a>
              </div>
            </Bezel>
          </div>
        </div>

        {/* Curriculum progress + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          {/* Curriculum by track */}
          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "440ms" }}>
            <Bezel padClass="p-5 sm:p-6" className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Curriculum progress</h2>
                <a href="/training/lessons" className="text-xs font-medium text-gray-500 hover:text-gray-900">
                  View all modules →
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {tracks.map((t) => {
                  const done = t.done >= t.total && t.total > 0;
                  const trackPct = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                  return (
                    <div key={t.key}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-medium text-gray-700 truncate flex items-center gap-1.5">
                          {done && (
                            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.8a1 1 0 011.4 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span className="truncate">{t.label}</span>
                        </span>
                        <span className="text-[11px] font-medium text-gray-400 tabular-nums shrink-0">
                          {t.done}/{t.total}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${trackPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Bezel>
          </div>

          {/* Goals editor */}
          <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "500ms" }} id="my-goals">
            <Bezel padClass="p-5 sm:p-6" className="h-full">
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
                    <select
                      value={draft.targetMonths}
                      onChange={(e) => setDraft((d) => ({ ...d, targetMonths: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Select a timeframe…</option>
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m} value={String(m)}>
                          Within {m} {m === 1 ? "month" : "months"}
                        </option>
                      ))}
                    </select>
                    {previewDate ? (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Target date:{" "}
                        <span className="font-medium text-gray-700">
                          {new Date(`${previewDate}T00:00:00`).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {previewDays !== null && previewDays >= 0 && ` · ${previewDays} days from today`}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-400">
                        Pick how many months out your goal is — we&apos;ll set the date and countdown.
                      </p>
                    )}
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
              ) : hasGoals ? (
                <div className="mt-4 space-y-3">
                  {goals.jobTitle && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Target role</p>
                      <p className="text-sm text-gray-900">{goals.jobTitle}</p>
                    </div>
                  )}
                  {goals.targetDate && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Land a job by
                        {goals.targetMonths && ` · within ${goals.targetMonths} ${goals.targetMonths === "1" ? "month" : "months"}`}
                      </p>
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
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Set a target role and a deadline to keep yourself accountable — your countdown lives up top.
                </p>
              )}
            </Bezel>
          </div>
        </div>

        {/* Ongoing projects list */}
        <div className="animate-fade-up" style={{ animationDelay: "560ms" }}>
          <Bezel padClass="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Your mock projects</h2>
              <a href="/training/practice" className="text-xs font-medium text-gray-500 hover:text-gray-900">
                Launch new →
              </a>
            </div>
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center">
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  No training projects yet. Head to{" "}
                  <a href="/training/practice" className="text-indigo-700 hover:text-indigo-800 font-medium">Practice</a>{" "}
                  to launch a real, private SiteCommand sandbox and run a job end to end.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`/projects/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-3 group"
                    >
                      <span
                        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 text-xs font-semibold"
                        style={{ background: "rgba(79,70,229,0.08)", color: "#4338CA" }}
                      >
                        {cleanProjectName(p.name).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                          {cleanProjectName(p.name)}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          {(() => {
                            const meta = [
                              p.training_role ? roleLabel(p.training_role) : null,
                              p.training_project_type ? projectTypeLabel(p.training_project_type) : null,
                            ].filter(Boolean);
                            return meta.length > 0 ? <span>{meta.join(" · ")}</span> : null;
                          })()}
                          {typeof p.training_day === "number" && (
                            <span
                              className="font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(79,70,229,0.08)", color: "#4338CA" }}
                            >
                              Day {p.training_day}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Bezel>
        </div>
      </main>
    </div>
  );
}
