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

type ResumeResult = {
  markdown: string;
  summary: string;
  suggestions: string[];
};

// The brain-dump is the biggest input on the page — survive a refresh.
const DRAFT_KEY = "sc-careers-resume-draft";

type Draft = {
  name: string;
  targetRole: string;
  yearsExperience: string;
  currentTitle: string;
  location: string;
  highlights: string;
  skills: string;
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/** Inline `**bold**` spans → JSX (no HTML injection — pure text nodes). */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
  );
}

/**
 * Tiny, safe Markdown preview for the generated resume: headings, bullets,
 * horizontal rules, bold, paragraphs. Everything is rendered as JSX text
 * nodes (never dangerouslySetInnerHTML), so model output can't inject markup.
 */
function ResumeMarkdown({ markdown }: { markdown: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key++} className="space-y-1 my-2">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm text-gray-700 leading-relaxed flex gap-2">
            <span className="shrink-0" style={{ color: "#EA580C" }}>•</span>
            <span>{renderInline(b)}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    if (!line) continue;
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line)) {
      blocks.push(<hr key={key++} className="my-3" style={{ borderColor: "rgba(0,0,0,0.08)" }} />);
    } else if (line.startsWith("### ")) {
      blocks.push(<h5 key={key++} className="text-sm font-semibold text-gray-900 mt-4 mb-1">{renderInline(line.slice(4))}</h5>);
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h4 key={key++} className="text-xs font-semibold tracking-widest uppercase mt-5 mb-2" style={{ color: "#EA580C" }}>
          {renderInline(line.slice(3))}
        </h4>
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h3 key={key++} className="font-display text-2xl text-gray-900 mb-1" style={{ letterSpacing: "-0.01em" }}>
          {renderInline(line.slice(2))}
        </h3>
      );
    } else {
      blocks.push(<p key={key++} className="text-sm text-gray-700 leading-relaxed my-1">{renderInline(line)}</p>);
    }
  }
  flushBullets();

  return <div>{blocks}</div>;
}

export default function ResumeBuilder() {
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [location, setLocation] = useState("");
  const [highlights, setHighlights] = useState("");
  const [skills, setSkills] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  // Restore a saved draft on mount, then persist edits (debounced).
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setName(draft.name ?? "");
      setTargetRole(draft.targetRole ?? "");
      setYearsExperience(draft.yearsExperience ?? "");
      setCurrentTitle(draft.currentTitle ?? "");
      setLocation(draft.location ?? "");
      setHighlights(draft.highlights ?? "");
      setSkills(draft.skills ?? "");
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ name, targetRole, yearsExperience, currentTitle, location, highlights, skills })
        );
      } catch {
        /* storage full or unavailable — drafts are best-effort */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [name, targetRole, yearsExperience, currentTitle, location, highlights, skills]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError("Tell us the role you're targeting.");
      return;
    }
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/careers/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetRole, yearsExperience, currentTitle, location, highlights, skills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data as ResumeResult);
    } catch (err) {
      setError(err instanceof Error && err.message !== "Failed" ? err.message : "Couldn't build your resume right now. Try again in a moment.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyResume() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the user can select the text manually */
    }
  }

  function downloadResume() {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || targetRole || "resume").trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-resume.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="resume-builder" className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="font-display text-3xl sm:text-4xl mb-2" style={{ letterSpacing: "-0.02em", color: "#111110" }}>
          Resume Builder
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          Tailored to construction. Drop in your projects and wins, and get an ATS-friendly resume
          written in the language GCs hire on — contract value, delivery method, RFIs, submittals, and schedule performance.
        </p>
      </div>

      <div style={bezelOuter}>
        <form onSubmit={handleSubmit} style={{ ...bezelInner, padding: "20px 24px" }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name">
              <input className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Jordan Alvarez" />
            </Field>
            <Field label="Target role" required>
              <input className={inputClass} style={inputStyle} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Senior Project Manager" />
            </Field>
            <Field label="Years of experience">
              <input className={inputClass} style={inputStyle} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="8" />
            </Field>
            <Field label="Current / most recent title">
              <input className={inputClass} style={inputStyle} value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Project Manager, Summit Builders" />
            </Field>
            <Field label="Location">
              <input className={inputClass} style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Denver, CO" />
            </Field>
            <Field label="Skills, software & certifications">
              <input className={inputClass} style={inputStyle} value={skills} onChange={(e) => setSkills(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Procore, Bluebeam, P6, OSHA 30, LEED AP" />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Experience, projects & accomplishments">
              <textarea
                className={inputClass}
                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                onFocus={focusOrange}
                onBlur={blurBorder}
                placeholder="e.g. Managed a $42M ground-up medical office building (design-build). Ran buyout, processed 300+ RFIs and submittals in Procore, delivered 3 weeks ahead of schedule and 2% under budget. Supervised a superintendent and 6 subcontractors…"
              />
            </Field>
          </div>

          {error && (
            <div className="mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
              {error}
            </div>
          )}

          <div className="mt-4">
            <button type="submit" disabled={loading} className={primaryButtonClass} style={primaryButtonStyle}>
              {loading ? "Writing your resume…" : result ? "Rebuild resume" : "Build my resume"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-4" style={bezelOuter}>
          <div style={{ ...bezelInner, padding: "20px 24px" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Your resume</span>
              <div className="flex gap-2">
                <button onClick={copyResume} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button onClick={downloadResume} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Download .md
                </button>
              </div>
            </div>
            <ResumeMarkdown markdown={result.markdown} />

            {result.suggestions.length > 0 && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">How to make it stronger</p>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span style={{ color: "#EA580C" }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">
        {label}
        {required && <span style={{ color: "#EA580C" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
