"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { SimRole } from "@/lib/simulation-constants";
import {
  getTrainingSchedule,
  getScheduledDay,
  firstScheduledDay,
} from "@/lib/training-schedule";

/**
 * The "coach" narrator for a "SiteCommand Training" sandbox, embedded as a
 * compact collapsible section inside the Day panel (TrainingDayPanel) instead
 * of a separate floating card. Each scheduled day carries a text message from
 * the coach: while unheard, the section sits expanded with a "New" chip and
 * loads that day's message automatically.
 *
 * "Heard" days are remembered per project (same localStorage key as the old
 * standalone card, so prior acknowledgements carry over) — once acknowledged
 * ("Got it") the section collapses to a single quiet row that can be reopened
 * to re-read anytime. The active day comes in as a prop from the Day panel, so
 * advancing a day surfaces the next message in place.
 */

// Shared with TrainingDayPanel so in-document localStorage writes notify it
// (the native "storage" event only fires in *other* tabs).
const CHANGE_EVENT = "sc-training-day-change";

function readString(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore unavailable storage */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function useLocalStorageString(key: string): [string, (next: string) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const getSnapshot = useCallback(() => readString(key), [key]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const setValue = useCallback((next: string) => writeString(key, next), [key]);
  return [value, setValue];
}

type NarrationData = {
  title: string;
  text: string;
};

export default function TrainingCoachSection({
  projectId,
  role,
  activeDay,
}: {
  projectId: string;
  role: SimRole;
  activeDay: number;
}) {
  const schedule = useMemo(() => getTrainingSchedule(role), [role]);
  const activeEntry = getScheduledDay(schedule, activeDay);
  const isFirstDay = !!activeEntry && activeEntry.day === firstScheduledDay(schedule);

  // Days whose coach message the trainee has acknowledged.
  const [heardRaw, setHeardRaw] = useLocalStorageString(`sc-training-coach-heard-${projectId}`);
  const heardDays = useMemo<Set<number>>(() => {
    try {
      const arr = heardRaw ? (JSON.parse(heardRaw) as number[]) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }, [heardRaw]);
  const heard = heardDays.has(activeDay);
  const markHeard = useCallback(
    (day: number) => {
      const next = new Set(heardDays);
      next.add(day);
      setHeardRaw(JSON.stringify([...next]));
    },
    [heardDays, setHeardRaw],
  );

  // Open/closed: unheard days start expanded, heard days start collapsed; the
  // trainee can toggle either way (null = follow the heard state).
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NarrationData | null>(null);

  const cacheRef = useRef<Map<number, NarrationData>>(new Map());

  // Advancing to a new day resets the section to its unread state (the
  // narration cache keeps any already-fetched days).
  const dayRef = useRef(activeDay);
  useEffect(() => {
    if (dayRef.current === activeDay) return;
    dayRef.current = activeDay;
    setExpandedOverride(null);
    setData(null);
    setError(null);
  }, [activeDay]);

  const fetchNarration = useCallback(
    async (day: number) => {
      const cached = cacheRef.current.get(day);
      if (cached) {
        setData(cached);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/training/narration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day }),
        });
        if (!res.ok) throw new Error("Failed to load narration");
        const json = await res.json();
        const nd: NarrationData = { title: json.title ?? "", text: json.text ?? "" };
        cacheRef.current.set(day, nd);
        setData(nd);
      } catch {
        setError("Couldn't load your coach message. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const expanded = expandedOverride ?? !heard;

  // The message loads automatically as soon as the section is open — no
  // separate "play" step, since it's just text.
  useEffect(() => {
    if (!activeEntry || !expanded || data || loading || error) return;
    void fetchNarration(activeDay);
  }, [activeEntry, expanded, data, loading, error, activeDay, fetchNarration]);

  // "Got it" — remember the day as heard and fold the section away.
  const acknowledge = useCallback(() => {
    markHeard(activeDay);
    setExpandedOverride(false);
  }, [activeDay, markHeard]);

  // No coach message on days without a scheduled task batch.
  if (!activeEntry) return null;

  const headerTitle = isFirstDay
    ? "Welcome to the project"
    : `${activeEntry.timeframe} — ${activeEntry.phase}`;

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50/60">
      <button
        type="button"
        onClick={() => setExpandedOverride(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-indigo-100/60"
      >
        <span aria-hidden className="text-base leading-none">💬</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-indigo-900">
            Message from your coach
          </span>
          <span className="block truncate text-[11px] text-indigo-600">{headerTitle}</span>
        </span>
        {!heard && (
          <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            New
          </span>
        )}
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-indigo-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-indigo-100 px-3 py-2.5">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <svg className="h-3.5 w-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Preparing your coach message…
            </div>
          ) : error ? (
            <div className="py-1">
              <p className="text-xs text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => fetchNarration(activeDay)}
                className="mt-2 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : data ? (
            <div>
              <div className="max-h-56 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-gray-700">
                {data.text}
              </div>

              <button
                type="button"
                onClick={acknowledge}
                className="mt-2.5 w-full rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Got it — let’s get to work
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
