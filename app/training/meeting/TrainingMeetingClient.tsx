"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTrainingMeeting,
  meetingSpeaker,
  type MeetingTurn,
} from "@/lib/training-meetings";
import { getTrainingSchedule } from "@/lib/training-schedule";

/**
 * The interactive meeting itself: a transcript of the attendees' turns, an
 * agenda tracker, and a text box for the PM whenever the floor is handed to
 * them. State (transcript / agenda position / done / walk progress) persists
 * per project + meeting in localStorage so a reload resumes where the meeting
 * left off.
 *
 * Meetings with a `walk` (the recurring OAC meetings) continue past the
 * sit-down agenda into a timed site walk: the owner and architect ask
 * questions deterministically, each on a countdown (30s). Answers are
 * recorded with their elapsed time and graded server-side with the minutes —
 * full credit for answering on the spot, half credit for correctly naming
 * where the information lives, nothing once the clock runs out.
 *
 * When the meeting adjourns, the transcript (+ walk answers) is sent to the
 * minutes endpoint, which writes formal minutes and scores the trainee.
 * Once minutes exist server-side, reopening the meeting hyperlink shows the
 * saved minutes instead of a live meeting. Adjourning also auto-checks the
 * matching Day-panel task in the shared localStorage store.
 */

type LocalWalkResponse = {
  id: string;
  answer: string;
  elapsedMs: number;
  expired: boolean;
};

type MeetingState = {
  transcript: MeetingTurn[];
  agendaIndex: number;
  done: boolean;
  /** -1 = walk not started; questions.length = walk finished. */
  walkIndex?: number;
  walkResponses?: LocalWalkResponse[];
  /** Epoch ms the current walk question was asked (persisted so a reload can't reset the clock). */
  walkAskedAt?: number | null;
};

type SavedWalkResult = {
  id: string;
  title: string;
  question: string;
  credit: "full" | "half" | "none";
  note: string;
  answer: string;
  elapsedMs: number;
  expired: boolean;
  skill: string;
};

type SavedMinutes = {
  meetingId: string;
  title: string;
  day: number;
  minutes: { summary: string; decisions: string[]; actionItems: string[] };
  checkpoints: {
    id: string;
    title: string;
    expectation: string;
    caught: boolean;
    note: string;
  }[];
  scoreCaught: number;
  scoreTotal: number;
  walkResults?: SavedWalkResult[];
  walkPoints?: number;
  walkTotal?: number;
  transcript: MeetingTurn[];
  completedAt: string;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore unavailable storage */
  }
}

/** Bubble accent per attendee (stable by speaker order). */
const SPEAKER_ACCENTS = [
  { chip: "bg-amber-100 text-amber-800", ring: "border-amber-200" },
  { chip: "bg-sky-100 text-sky-800", ring: "border-sky-200" },
  { chip: "bg-violet-100 text-violet-800", ring: "border-violet-200" },
  { chip: "bg-teal-100 text-teal-800", ring: "border-teal-200" },
];

/** Spoken by the asker when the walk clock runs out on a question. */
const WALK_TIME_UP_LINE =
  "(Checks watch) That's time. On a walk you get thirty seconds before I stop trusting the answer — put it in the minutes with a source by end of day. Let's keep moving.";

function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export default function TrainingMeetingClient({
  projectId,
  meetingId,
  projectName,
}: {
  projectId: string;
  meetingId: string;
  projectName: string;
}) {
  const meeting = useMemo(() => getTrainingMeeting(meetingId), [meetingId]);
  const storageKey = `sc-training-meeting-${projectId}-${meetingId}`;
  const minutesUrl = `/api/projects/${projectId}/training/meetings/${meetingId}/minutes`;

  const [transcript, setTranscript] = useState<MeetingTurn[]>([]);
  const [agendaIndex, setAgendaIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const [walkIndex, setWalkIndex] = useState(-1);
  const [walkResponses, setWalkResponses] = useState<LocalWalkResponse[]>([]);
  const [walkAskedAt, setWalkAskedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);

  const [minutes, setMinutes] = useState<SavedMinutes | null>(null);
  const [minutesBusy, setMinutesBusy] = useState(false);
  const [minutesError, setMinutesError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const advancingRef = useRef(false);

  const walkQuestions = meeting?.walk?.questions ?? [];
  const walkLimitMs = (meeting?.walk?.timeLimitSeconds ?? 30) * 1000;
  const walkActive = done && !!meeting?.walk && walkIndex >= 0 && walkIndex < walkQuestions.length;
  const adjourned = done && (!meeting?.walk || walkIndex >= walkQuestions.length);

  const persist = useCallback(
    (state: MeetingState) => writeJSON(storageKey, state),
    [storageKey],
  );

  // When the meeting adjourns, check the matching task off in the Day panel's
  // store (the project tab picks the write up via the cross-tab storage event).
  const markTaskComplete = useCallback(() => {
    if (!meeting) return;
    const day = getTrainingSchedule(meeting.role).find((d) => d.day === meeting.day);
    const idx = day?.tasks.findIndex((t) => t.task === meeting.taskMatch) ?? -1;
    if (idx < 0) return;
    const tasksKey = `sc-training-tasks-${projectId}`;
    const checks = readJSON<Record<string, boolean>>(tasksKey, {});
    if (!checks[`${meeting.day}-${idx}`]) {
      checks[`${meeting.day}-${idx}`] = true;
      writeJSON(tasksKey, checks);
    }
  }, [meeting, projectId]);

  // Generate + persist the minutes from a completed transcript.
  const saveMinutes = useCallback(
    async (finalTranscript: MeetingTurn[], finalWalkResponses: LocalWalkResponse[]) => {
      setMinutesBusy(true);
      setMinutesError(null);
      try {
        const res = await fetch(minutesUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            walkResponses: finalWalkResponses,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Couldn't save the meeting minutes");
        setMinutes(data.minutes);
      } catch (e) {
        setMinutesError(e instanceof Error ? e.message : "Couldn't save the meeting minutes");
      } finally {
        setMinutesBusy(false);
      }
    },
    [minutesUrl],
  );

  /** Append the walk intro + first question and start the clock. */
  const startWalk = useCallback(
    (fromTranscript: MeetingTurn[], responses: LocalWalkResponse[]) => {
      if (!meeting?.walk) return;
      const first = meeting.walk.questions[0];
      const next = [
        ...fromTranscript,
        meeting.walk.intro,
        { speaker: first.speakerKey, text: first.ask },
      ];
      const askedAt = Date.now();
      setTranscript(next);
      setWalkIndex(0);
      setWalkResponses(responses);
      setWalkAskedAt(askedAt);
      persist({
        transcript: next,
        agendaIndex: meeting.agenda.length,
        done: true,
        walkIndex: 0,
        walkResponses: responses,
        walkAskedAt: askedAt,
      });
    },
    [meeting, persist],
  );

  /**
   * Record the current walk question (answerText null = clock expired) and
   * move to the next question — or wrap the walk and adjourn.
   */
  const advanceWalk = useCallback(
    (answerText: string | null) => {
      if (!meeting?.walk || advancingRef.current) return;
      if (walkIndex < 0 || walkIndex >= meeting.walk.questions.length) return;
      advancingRef.current = true;
      try {
        const q = meeting.walk.questions[walkIndex];
        const elapsed = walkAskedAt ? Date.now() - walkAskedAt : walkLimitMs;
        const response: LocalWalkResponse = {
          id: q.id,
          answer: answerText ?? "",
          elapsedMs: Math.min(Math.max(0, elapsed), walkLimitMs),
          expired: answerText === null,
        };
        const responses = [...walkResponses.filter((r) => r.id !== q.id), response];

        const next = [...transcript];
        if (answerText !== null) {
          next.push({ speaker: "user", text: answerText });
        } else {
          next.push({ speaker: q.speakerKey, text: WALK_TIME_UP_LINE });
        }

        const nextIndex = walkIndex + 1;
        let askedAt: number | null = null;
        if (nextIndex < meeting.walk.questions.length) {
          const nq = meeting.walk.questions[nextIndex];
          next.push({ speaker: nq.speakerKey, text: nq.ask });
          askedAt = Date.now();
        } else {
          next.push(meeting.walk.outro);
        }

        setTranscript(next);
        setWalkIndex(nextIndex);
        setWalkResponses(responses);
        setWalkAskedAt(askedAt);
        persist({
          transcript: next,
          agendaIndex: meeting.agenda.length,
          done: true,
          walkIndex: nextIndex,
          walkResponses: responses,
          walkAskedAt: askedAt,
        });

        if (nextIndex >= meeting.walk.questions.length) {
          markTaskComplete();
          void saveMinutes(next, responses);
        }
      } finally {
        advancingRef.current = false;
      }
    },
    [meeting, walkIndex, walkAskedAt, walkLimitMs, walkResponses, transcript, persist, markTaskComplete, saveMinutes],
  );

  const fetchTurns = useCallback(
    async (currentTranscript: MeetingTurn[], currentIndex: number) => {
      const res = await fetch(`/api/projects/${projectId}/training/meetings/${meetingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: currentTranscript, agendaIndex: currentIndex }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The meeting couldn't continue");
      const turns: MeetingTurn[] = Array.isArray(data.turns) ? data.turns : [];
      const nextTranscript = [...currentTranscript, ...turns];
      const nextIndex = typeof data.agendaIndex === "number" ? data.agendaIndex : currentIndex;
      const nextDone = !!data.done;
      setTranscript(nextTranscript);
      setAgendaIndex(nextIndex);
      setDone(nextDone);
      persist({
        transcript: nextTranscript,
        agendaIndex: nextIndex,
        done: nextDone,
        walkIndex,
        walkResponses,
        walkAskedAt,
      });
      if (nextDone) {
        if (meeting?.walk && walkIndex === -1) {
          // The sit-down agenda is finished — the site walk begins now.
          startWalk(nextTranscript, walkResponses);
        } else {
          markTaskComplete();
          void saveMinutes(nextTranscript, walkResponses);
        }
      }
    },
    [projectId, meetingId, persist, markTaskComplete, saveMinutes, meeting, walkIndex, walkResponses, walkAskedAt, startWalk],
  );

  // On mount: saved server-side minutes win (the meeting was completed —
  // possibly in another browser); otherwise resume the local transcript or
  // kick off the opening turns.
  useEffect(() => {
    if (startedRef.current || !meeting) return;
    startedRef.current = true;
    (async () => {
      try {
        const res = await fetch(minutesUrl, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.minutes) {
            setMinutes(data.minutes);
            markTaskComplete();
            setLoading(false);
            return;
          }
        }
      } catch {
        /* fall through to the live meeting */
      }

      const saved = readJSON<MeetingState | null>(storageKey, null);
      if (saved && Array.isArray(saved.transcript) && saved.transcript.length > 0) {
        const savedWalkIndex = saved.walkIndex ?? -1;
        const savedResponses = saved.walkResponses ?? [];
        setTranscript(saved.transcript);
        setAgendaIndex(saved.agendaIndex ?? 0);
        setDone(!!saved.done);
        setWalkIndex(savedWalkIndex);
        setWalkResponses(savedResponses);
        setWalkAskedAt(saved.walkAskedAt ?? null);
        setLoading(false);

        if (saved.done) {
          const walkFinished =
            !meeting.walk || savedWalkIndex >= (meeting.walk?.questions.length ?? 0);
          if (walkFinished) {
            // Completed but never persisted (e.g. an earlier session where the
            // save failed) — generate the minutes now.
            void saveMinutes(saved.transcript, savedResponses);
          } else if (meeting.walk && savedWalkIndex === -1) {
            // Conversation finished but the walk never started (older save).
            startWalk(saved.transcript, savedResponses);
          } else if (meeting.walk && saved.walkAskedAt == null) {
            // Mid-walk with no clock (shouldn't happen) — restart the clock.
            setWalkAskedAt(Date.now());
          }
          // Mid-walk with a persisted clock: the expiry effect handles a
          // question whose time ran out while the tab was closed.
        }
        return;
      }
      try {
        await fetchTurns([], 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The meeting couldn't start");
      } finally {
        setLoading(false);
      }
    })();
  }, [meeting, storageKey, minutesUrl, fetchTurns, markTaskComplete, saveMinutes, startWalk]);

  // Walk countdown: tick while a question is on the clock…
  useEffect(() => {
    if (!walkActive || walkAskedAt == null) return;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(iv);
  }, [walkActive, walkAskedAt]);

  // …and expire the question when the clock runs out.
  useEffect(() => {
    if (!walkActive || walkAskedAt == null || nowTick === 0) return;
    if (nowTick - walkAskedAt >= walkLimitMs) advanceWalk(null);
  }, [nowTick, walkActive, walkAskedAt, walkLimitMs, advanceWalk]);

  useEffect(() => {
    if (!minutes) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, sending, minutes]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if (walkActive) {
      setInput("");
      advanceWalk(text);
      return;
    }
    if (done) return;
    setSending(true);
    setError(null);
    setInput("");
    const withUser = [...transcript, { speaker: "user", text }];
    setTranscript(withUser);
    persist({ transcript: withUser, agendaIndex, done, walkIndex, walkResponses, walkAskedAt });
    try {
      await fetchTurns(withUser, agendaIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The meeting couldn't continue");
    } finally {
      setSending(false);
    }
  }

  function restart() {
    if (
      !window.confirm(
        "Restart this meeting from the top? The transcript will be cleared, and completing it again will regenerate the saved minutes and score.",
      )
    ) {
      return;
    }
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setTranscript([]);
    setAgendaIndex(0);
    setDone(false);
    setWalkIndex(-1);
    setWalkResponses([]);
    setWalkAskedAt(null);
    setError(null);
    setMinutes(null);
    setMinutesError(null);
    setShowTranscript(false);
    setLoading(true);
    (async () => {
      try {
        await fetchTurns([], 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The meeting couldn't start");
      } finally {
        setLoading(false);
      }
    })();
  }

  function returnToProject() {
    window.close();
    window.location.href = `/projects/${projectId}`;
  }

  if (!meeting) return null;

  const remainingMs =
    walkActive && walkAskedAt != null
      ? Math.max(0, walkLimitMs - ((nowTick || Date.now()) - walkAskedAt))
      : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);

  function renderTranscript(turns: MeetingTurn[]) {
    return (
      <div className="space-y-4">
        {turns.map((t, i) => {
          if (t.speaker === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-gray-900 px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold text-gray-300">You</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white whitespace-pre-line">
                    {t.text}
                  </p>
                </div>
              </div>
            );
          }
          const speaker = meetingSpeaker(meeting!, t.speaker);
          const idx = meeting!.speakers.findIndex((s) => s.key === t.speaker);
          const accent = SPEAKER_ACCENTS[Math.max(0, idx) % SPEAKER_ACCENTS.length];
          return (
            <div key={i} className="flex justify-start">
              <div
                className={`max-w-[85%] rounded-xl rounded-bl-sm border bg-gray-50 px-3.5 py-2.5 ${accent.ring}`}
              >
                <p className="text-[11px] font-semibold text-gray-500">
                  {speaker?.name ?? t.speaker}
                  <span className="ml-1.5 font-normal text-gray-400">{speaker?.title}</span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                  {t.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Saved-minutes view (meeting already completed) ─────────────────────────
  if (minutes) {
    const pct =
      minutes.scoreTotal > 0 ? Math.round((minutes.scoreCaught / minutes.scoreTotal) * 100) : 0;
    const walkResults = minutes.walkResults ?? [];
    const walkTotal = minutes.walkTotal ?? 0;
    const walkPoints = minutes.walkPoints ?? 0;
    const walkPct = walkTotal > 0 ? Math.round((walkPoints / walkTotal) * 100) : 0;
    return (
      <div className="max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Meeting Minutes · Day {minutes.day}
          </p>
          <h1 className="text-xl font-semibold text-gray-900 mt-0.5">{minutes.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projectName}
            {minutes.completedAt
              ? ` · held ${new Date(minutes.completedAt).toLocaleDateString()}`
              : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {meeting.speakers.map((s, i) => {
              const accent = SPEAKER_ACCENTS[i % SPEAKER_ACCENTS.length];
              return (
                <span
                  key={s.key}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${accent.chip}`}
                >
                  {s.name} · {s.title}
                </span>
              );
            })}
            <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
              You · Project Manager
            </span>
          </div>
        </div>

        {/* Effectiveness score (checkpoint meetings only) */}
        {minutes.scoreTotal > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Meeting effectiveness</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  pct >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : pct >= 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {minutes.scoreCaught}/{minutes.scoreTotal} caught
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              This meeting contained planted issues you were expected to catch. Here&apos;s how you
              did:
            </p>
            <ul className="mt-3 space-y-2">
              {minutes.checkpoints.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-lg border px-3 py-2 ${
                    c.caught ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">
                    <span className={c.caught ? "text-emerald-600" : "text-red-500"}>
                      {c.caught ? "✓" : "✕"}
                    </span>{" "}
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">{c.note}</p>
                  {!c.caught && (
                    <p className="mt-1 text-xs text-gray-400">
                      <span className="font-medium text-gray-500">What to catch:</span>{" "}
                      {c.expectation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Site-walk Q&A score */}
        {walkTotal > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Site walk Q&amp;A</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  walkPct >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : walkPct >= 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {formatPoints(walkPoints)}/{walkTotal} pts
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              The owner and architect quizzed you on the walk — 30 seconds per question. Full
              credit for answering on the spot; half credit for correctly naming where the
              information lives.
            </p>
            <ul className="mt-3 space-y-2">
              {walkResults.map((r) => {
                const def = meeting.walk?.questions.find((q) => q.id === r.id);
                const tone =
                  r.credit === "full"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : r.credit === "half"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-red-200 bg-red-50/40";
                const mark =
                  r.credit === "full" ? (
                    <span className="text-emerald-600">✓ Full</span>
                  ) : r.credit === "half" ? (
                    <span className="text-amber-600">◐ Half</span>
                  ) : (
                    <span className="text-red-500">✕ Missed</span>
                  );
                return (
                  <li key={r.id} className={`rounded-lg border px-3 py-2 ${tone}`}>
                    <p className="text-sm font-medium text-gray-800">
                      {mark} <span className="ml-1">{r.title}</span>
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {r.expired
                          ? "time expired"
                          : `answered in ${Math.max(1, Math.round(r.elapsedMs / 1000))}s`}
                      </span>
                    </p>
                    {r.answer && (
                      <p className="mt-0.5 text-sm text-gray-600 italic">&ldquo;{r.answer}&rdquo;</p>
                    )}
                    <p className="mt-0.5 text-sm text-gray-600">{r.note}</p>
                    {r.credit !== "full" && def && (
                      <p className="mt-1 text-xs text-gray-400">
                        <span className="font-medium text-gray-500">Full-credit answer:</span>{" "}
                        {def.fullAnswer}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Minutes */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Minutes</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {minutes.minutes.summary}
          </p>
          {minutes.minutes.decisions.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Decisions
              </h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {minutes.minutes.decisions.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {d}
                  </li>
                ))}
              </ul>
            </>
          )}
          {minutes.minutes.actionItems.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Action items
              </h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {minutes.minutes.actionItems.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Full transcript, collapsed by default */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-gray-900">Full transcript</span>
            <span className="text-xs text-gray-400">{showTranscript ? "Hide" : "Show"}</span>
          </button>
          {showTranscript && (
            <div className="mt-4">{renderTranscript(minutes.transcript ?? [])}</div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={returnToProject}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Return to project
          </button>
          <button
            onClick={restart}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Restart meeting
          </button>
        </div>
      </div>
    );
  }

  // ── Live meeting view ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Day {meeting.day} Meeting
        </p>
        <h1 className="text-xl font-semibold text-gray-900 mt-0.5">{meeting.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{projectName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {meeting.speakers.map((s, i) => {
            const accent = SPEAKER_ACCENTS[i % SPEAKER_ACCENTS.length];
            return (
              <span
                key={s.key}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${accent.chip}`}
              >
                {s.name} · {s.title}
              </span>
            );
          })}
          <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
            You · Project Manager
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-600">{meeting.objective}</p>
        <p className="mt-1 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Deliverable:</span> {meeting.deliverable}
        </p>
      </div>

      {/* Agenda tracker */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Agenda</h2>
        <ol className="space-y-1.5">
          {meeting.agenda.map((item, i) => {
            const isDone = done || i < agendaIndex;
            const isCurrent = !done && i === agendaIndex;
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-green-600 text-white"
                      : isCurrent
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span
                  className={
                    isCurrent
                      ? "font-medium text-gray-900"
                      : isDone
                        ? "text-gray-400"
                        : "text-gray-500"
                  }
                >
                  {item.title}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                      Now
                    </span>
                  )}
                </span>
              </li>
            );
          })}
          {meeting.walk && (
            <li className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  adjourned
                    ? "bg-green-600 text-white"
                    : walkActive
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {adjourned ? "✓" : meeting.agenda.length + 1}
              </span>
              <span
                className={
                  walkActive
                    ? "font-medium text-gray-900"
                    : adjourned
                      ? "text-gray-400"
                      : "text-gray-500"
                }
              >
                Site walk — Q&amp;A with the owner &amp; architect
                {walkActive && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                    Now · Question {walkIndex + 1}/{walkQuestions.length}
                  </span>
                )}
              </span>
            </li>
          )}
        </ol>
      </div>

      {/* Transcript */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
        {loading ? (
          <p className="text-sm text-gray-400">The team is gathering…</p>
        ) : (
          <>
            {renderTranscript(transcript)}
            {sending && (
              <div className="mt-4 flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <p className="text-sm text-gray-400">…</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input / adjourned footer */}
      {adjourned ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            ✓ Meeting adjourned — your Day {meeting.day} meeting task is checked off.
          </p>
          {minutesBusy ? (
            <p className="mt-1 text-sm text-emerald-800">
              Writing up the minutes and scoring your meeting…
            </p>
          ) : minutesError ? (
            <div className="mt-1">
              <p className="text-sm text-red-700">{minutesError}</p>
              <button
                onClick={() => saveMinutes(transcript, walkResponses)}
                className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Retry saving minutes
              </button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-emerald-800">
              Next step: get the {meeting.deliverable.toLowerCase()} documented and distributed.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={returnToProject}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Return to project
            </button>
            <button
              onClick={restart}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Restart meeting
            </button>
          </div>
        </div>
      ) : (
        !loading && (
          <div
            className={`rounded-xl border p-4 ${
              walkActive
                ? remainingSec <= 10
                  ? "border-red-300 bg-red-50/50"
                  : "border-amber-300 bg-amber-50/50"
                : "border-gray-200 bg-white"
            }`}
          >
            {walkActive ? (
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">
                  You&apos;re on the spot — answer now, or say exactly where you&apos;d find it
                  (half credit).
                </p>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                    remainingSec <= 10 ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  0:{String(remainingSec).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <p className="mb-2 text-xs font-medium text-gray-500">
                {sending ? "The team is responding…" : "You have the floor — respond to the team."}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                disabled={sending}
                placeholder={
                  walkActive
                    ? "Answer on the spot… (Enter to send)"
                    : "Type your response… (Enter to send, Shift+Enter for a new line)"
                }
                className="min-h-[3rem] flex-1 resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-gray-50"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={restart}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Restart meeting
              </button>
              <button
                onClick={returnToProject}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Leave meeting
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
