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
 * of a separate floating card. Each scheduled day carries a message from the
 * coach: while unheard, the section sits expanded with a "New" chip inviting
 * the trainee to play it; clicking play fetches an ElevenLabs-narrated MP3 of
 * that day's briefing (synthesized + cached server-side) and plays it
 * alongside the transcript.
 *
 * "Heard" days are remembered per project (same localStorage key as the old
 * standalone card, so prior acknowledgements carry over) — once acknowledged
 * ("Got it" / Skip) the section collapses to a single quiet row that can be
 * reopened to replay anytime. The active day comes in as a prop from the Day
 * panel, so advancing a day surfaces the next message in place.
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
  url?: string;
  audio: boolean;
  /** When audio is false, why — "no_key" | "tts_failed" | "upload_failed" | … */
  reason?: string;
  /** HTTP status from ElevenLabs when reason === "tts_failed". */
  status?: number;
  /** Human-readable detail (ElevenLabs error / storage error) for failures. */
  message?: string;
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
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NarrationData | null>(null);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<number, NarrationData>>(new Map());

  // Advancing to a new day resets the section to its invite state (the
  // narration cache keeps any already-fetched days).
  const dayRef = useRef(activeDay);
  useEffect(() => {
    if (dayRef.current === activeDay) return;
    dayRef.current = activeDay;
    audioRef.current?.pause();
    setExpandedOverride(null);
    setStarted(false);
    setData(null);
    setError(null);
  }, [activeDay]);

  const fetchNarration = useCallback(
    async (day: number): Promise<NarrationData | null> => {
      const cached = cacheRef.current.get(day);
      if (cached) {
        setData(cached);
        return cached;
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
        const nd: NarrationData = {
          title: json.title ?? "",
          text: json.text ?? "",
          url: typeof json.url === "string" ? json.url : undefined,
          audio: !!json.audio,
          reason: typeof json.reason === "string" ? json.reason : undefined,
          status: typeof json.status === "number" ? json.status : undefined,
          message: typeof json.message === "string" ? json.message : undefined,
        };
        cacheRef.current.set(day, nd);
        setData(nd);
        return nd;
      } catch {
        setError("Couldn't load your coach message. Please try again.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const handleStart = useCallback(async () => {
    setStarted(true);
    const nd = await fetchNarration(activeDay);
    if (nd?.audio && nd.url && audioRef.current) {
      audioRef.current.src = nd.url;
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [activeDay, fetchNarration]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !data?.url) return;
    if (playing) {
      el.pause();
    } else {
      if (!el.src) el.src = data.url;
      el.play().catch(() => setPlaying(false));
    }
  }, [playing, data]);

  const replay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !data?.url) return;
    if (!el.src) el.src = data.url;
    el.currentTime = 0;
    el.play().catch(() => setPlaying(false));
  }, [data]);

  // "Got it" / Skip — remember the day as heard and fold the section away.
  const acknowledge = useCallback(() => {
    audioRef.current?.pause();
    markHeard(activeDay);
    setExpandedOverride(false);
    setStarted(false);
  }, [activeDay, markHeard]);

  // No coach message on days without a scheduled task batch.
  if (!activeEntry) return null;

  const expanded = expandedOverride ?? !heard;
  const headerTitle = isFirstDay
    ? "Welcome to the project"
    : `${activeEntry.timeframe} — ${activeEntry.phase}`;

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50/60">
      {/* A single, stable <audio> element so playback survives expanding/collapsing the section. */}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setExpandedOverride(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-indigo-100/60"
      >
        <span aria-hidden className="text-base leading-none">🎧</span>
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
          {!started ? (
            <div>
              <p className="text-xs leading-relaxed text-indigo-800">
                {isFirstDay
                  ? "Get started with a welcome message from your coach."
                  : "A quick briefing on what matters today before you dive in."}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play message
                </button>
                {!heard && (
                  <button
                    type="button"
                    onClick={acknowledge}
                    className="text-[11px] text-indigo-500 transition-colors hover:text-indigo-700"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <svg className="h-3.5 w-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Preparing your coach…
            </div>
          ) : error ? (
            <div className="py-1">
              <p className="text-xs text-red-600">{error}</p>
              <button
                type="button"
                onClick={handleStart}
                className="mt-2 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : data ? (
            <div>
              {data.audio && data.url ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={replay}
                    className="flex items-center gap-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Replay
                  </button>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-indigo-500">
                    {playing && (
                      <span className="flex items-end gap-0.5" aria-hidden>
                        <span className="h-2 w-0.5 animate-pulse bg-indigo-400" />
                        <span className="h-3 w-0.5 animate-pulse bg-indigo-500 [animation-delay:120ms]" />
                        <span className="h-1.5 w-0.5 animate-pulse bg-indigo-400 [animation-delay:240ms]" />
                      </span>
                    )}
                    {playing ? "Playing" : "Paused"}
                  </span>
                </div>
              ) : (
                <div className="rounded-md bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                  {data.reason === "no_key" ? (
                    <p>
                      Audio narration isn’t set up yet. Add an ElevenLabs API key under{" "}
                      <a
                        href="/settings/integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline"
                      >
                        Settings → Integrations
                      </a>{" "}
                      to hear your coach. Here’s the message:
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="flex flex-wrap items-center gap-x-1.5">
                        <span>Audio couldn’t be generated right now — here’s your coach’s message.</span>
                        <button type="button" onClick={handleStart} className="font-medium underline">
                          Try again
                        </button>
                      </p>
                      {(data.message || data.status) && (
                        <p className="text-[10px] leading-snug text-amber-700/80">
                          {data.reason === "tts_failed" ? "ElevenLabs" : "Server"}
                          {data.status ? ` ${data.status}` : ""}
                          {data.message ? `: ${data.message}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 max-h-44 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-gray-700">
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
