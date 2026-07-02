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
 * them. State (transcript / agenda position / done) persists per project +
 * meeting in localStorage so a reload resumes where the meeting left off.
 * When the meeting adjourns, the matching Day-panel task is auto-checked in
 * the same localStorage store the panel reads.
 */

type MeetingState = {
  transcript: MeetingTurn[];
  agendaIndex: number;
  done: boolean;
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

  const [transcript, setTranscript] = useState<MeetingTurn[]>([]);
  const [agendaIndex, setAgendaIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

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
      persist({ transcript: nextTranscript, agendaIndex: nextIndex, done: nextDone });
      if (nextDone) markTaskComplete();
    },
    [projectId, meetingId, persist, markTaskComplete],
  );

  // Resume a saved meeting, or kick off the opening turns.
  useEffect(() => {
    if (startedRef.current || !meeting) return;
    startedRef.current = true;
    const saved = readJSON<MeetingState | null>(storageKey, null);
    if (saved && Array.isArray(saved.transcript) && saved.transcript.length > 0) {
      setTranscript(saved.transcript);
      setAgendaIndex(saved.agendaIndex ?? 0);
      setDone(!!saved.done);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await fetchTurns([], 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The meeting couldn't start");
      } finally {
        setLoading(false);
      }
    })();
  }, [meeting, storageKey, fetchTurns]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending || done) return;
    setSending(true);
    setError(null);
    setInput("");
    const withUser = [...transcript, { speaker: "user", text }];
    setTranscript(withUser);
    persist({ transcript: withUser, agendaIndex, done });
    try {
      await fetchTurns(withUser, agendaIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The meeting couldn't continue");
    } finally {
      setSending(false);
    }
  }

  function restart() {
    if (!window.confirm("Restart this meeting from the top? The transcript will be cleared.")) {
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
    setError(null);
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
        </ol>
      </div>

      {/* Transcript */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
        {loading ? (
          <p className="text-sm text-gray-400">The team is gathering…</p>
        ) : (
          <div className="space-y-4">
            {transcript.map((t, i) => {
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
              const speaker = meetingSpeaker(meeting, t.speaker);
              const idx = meeting.speakers.findIndex((s) => s.key === t.speaker);
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
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <p className="text-sm text-gray-400">…</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input / adjourned footer */}
      {done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            ✓ Meeting adjourned — your Day {meeting.day} meeting task is checked off.
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Next step: get the {meeting.deliverable.toLowerCase()} documented and start your scope
            calls with the short-listed firms.
          </p>
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
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              {sending ? "The team is responding…" : "You have the floor — respond to the team."}
            </p>
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
                placeholder="Type your response… (Enter to send, Shift+Enter for a new line)"
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
