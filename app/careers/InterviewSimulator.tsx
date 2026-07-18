"use client";

import { useEffect, useRef, useState } from "react";
import {
  bezelOuter,
  bezelInner,
  inputClass,
  inputStyle,
  focusOrange,
  blurBorder,
  primaryButtonClass,
  primaryButtonStyle,
} from "./careerUi";

type Turn = { role: "interviewer" | "candidate"; text: string };

const ROLE_OPTIONS = [
  "Construction Project Manager",
  "Assistant Project Manager",
  "Project Engineer",
  "Superintendent",
  "Estimator",
  "Construction Project Accountant",
];

export default function InterviewSimulator() {
  const [targetRole, setTargetRole] = useState(ROLE_OPTIONS[0]);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, loading]);

  async function requestTurn(nextTranscript: Turn[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/careers/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, transcript: nextTranscript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTranscript([...nextTranscript, { role: "interviewer", text: data.message }]);
      setDone(Boolean(data.done));
    } catch (err) {
      setError(err instanceof Error && err.message !== "Failed" ? err.message : "The interviewer couldn't respond. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    setStarted(true);
    setDone(false);
    setTranscript([]);
    await requestTurn([]);
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    const text = answer.trim();
    if (!text || loading || done) return;
    setAnswer("");
    await requestTurn([...transcript, { role: "candidate", text }]);
  }

  function reset() {
    setStarted(false);
    setDone(false);
    setTranscript([]);
    setAnswer("");
    setError("");
  }

  return (
    <section id="interview-simulator" className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="font-display text-3xl sm:text-4xl mb-2" style={{ letterSpacing: "-0.02em", color: "#111110" }}>
          Interview Simulator
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          Mock interviews. Practice with a hiring manager who asks the behavioral and situational
          questions GCs really ask — and coaches your answers after each one.
        </p>
      </div>

      <div style={bezelOuter}>
        <div style={{ ...bezelInner, padding: "20px 24px" }}>
          {!started ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Interviewing for</label>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <select
                  className={inputClass}
                  style={inputStyle}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  onFocus={focusOrange}
                  onBlur={blurBorder}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button onClick={start} disabled={loading} className={primaryButtonClass} style={primaryButtonStyle}>
                  {loading ? "Starting…" : "Start interview"}
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-400">A 5-question mock interview with live coaching. Answer as you would in the room.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold tracking-wide text-gray-500">Mock interview · {targetRole}</span>
                <button onClick={reset} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  New interview
                </button>
              </div>

              <div ref={scrollRef} className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {transcript.map((t, i) => (
                  <div key={i} className={t.role === "candidate" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                      style={
                        t.role === "candidate"
                          ? { background: "#111110", color: "#FFFFFF" }
                          : { background: "rgba(234,88,12,0.06)", color: "#3f3f46", border: "1px solid rgba(234,88,12,0.12)" }
                      }
                    >
                      {t.role === "interviewer" && (
                        <span className="block text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: "#EA580C" }}>
                          Interviewer
                        </span>
                      )}
                      {t.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2.5 text-sm text-gray-400" style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.12)" }}>
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {error}
                </div>
              )}

              {done ? (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm text-center" style={{ background: "rgba(21,128,61,0.06)", color: "#166534", border: "1px solid rgba(21,128,61,0.15)" }}>
                  Interview complete. Review the feedback above, then{" "}
                  <button onClick={start} className="underline underline-offset-2 font-semibold">run it again</button>.
                </div>
              ) : (
                <form onSubmit={submitAnswer} className="mt-4">
                  <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <textarea
                      className={inputClass}
                      style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onFocus={focusOrange}
                      onBlur={blurBorder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer(e);
                      }}
                      placeholder="Type your answer… (⌘/Ctrl + Enter to send)"
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading || !answer.trim()} className={primaryButtonClass} style={primaryButtonStyle}>
                      Send
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
