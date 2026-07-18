"use client";

import { useState } from "react";
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
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-relaxed font-sans" style={{ fontFamily: "inherit" }}>
              {result.markdown}
            </pre>

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
