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

type SalaryResult = {
  role: string;
  location: string;
  currency: string;
  low: number;
  median: number;
  high: number;
  totalCompNote: string;
  summary: string;
  factors: string[];
};

function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString("en-US")}`;
  }
}

export default function SalaryBenchmarks() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SalaryResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim()) {
      setError("Enter a role to benchmark.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/careers/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, yearsExperience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data as SalaryResult);
    } catch (err) {
      setError(err instanceof Error && err.message !== "Failed" ? err.message : "Couldn't estimate salary right now. Try again in a moment.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Position of the median marker within the low→high bar (clamped 6–94%).
  const medianPct = result && result.high > result.low
    ? Math.min(94, Math.max(6, ((result.median - result.low) / (result.high - result.low)) * 100))
    : 50;

  return (
    <section id="salary-benchmarks" className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="font-display text-3xl sm:text-4xl mb-2" style={{ letterSpacing: "-0.02em", color: "#111110" }}>
          Salary Benchmarks
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          Know your market value. Get a realistic base-pay range for construction roles by title,
          location, and experience — plus the total-comp extras and the factors that move you up the range.
        </p>
      </div>

      <div style={bezelOuter}>
        <form onSubmit={handleSubmit} style={{ ...bezelInner, padding: "20px 24px" }}>
          <div className="grid sm:grid-cols-[1.4fr_1fr_0.7fr] gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Role / title <span style={{ color: "#EA580C" }}>*</span></label>
              <input className={inputClass} style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Senior Project Manager" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Location</label>
              <input className={inputClass} style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="Austin, TX" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Years exp.</label>
              <input className={inputClass} style={inputStyle} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} onFocus={focusOrange} onBlur={blurBorder} placeholder="10" />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={loading} className={primaryButtonClass} style={primaryButtonStyle}>
              {loading ? "Estimating…" : "Get benchmark"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-4 rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4" style={bezelOuter}>
          <div style={{ ...bezelInner, padding: "24px" }}>
            <p className="text-xs text-gray-400 mb-1">Estimated annual base · {result.role} · {result.location}</p>

            <div className="flex items-end justify-between gap-4 mb-1">
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Median</p>
                <p className="font-display text-4xl sm:text-5xl" style={{ letterSpacing: "-0.02em", color: "#111110" }}>
                  {money(result.median, result.currency)}
                </p>
              </div>
            </div>

            {/* Range bar */}
            <div className="mt-4">
              <div className="relative h-2.5 rounded-full" style={{ background: "linear-gradient(90deg, rgba(234,88,12,0.15), rgba(234,88,12,0.55))" }}>
                <div
                  className="absolute -top-1 w-1 h-4.5 rounded-full"
                  style={{ left: `calc(${medianPct}% - 2px)`, height: "18px", background: "#EA580C", boxShadow: "0 0 0 3px rgba(234,88,12,0.18)" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{money(result.low, result.currency)} <span className="text-gray-400">low</span></span>
                <span>{money(result.high, result.currency)} <span className="text-gray-400">high</span></span>
              </div>
            </div>

            {result.summary && <p className="mt-5 text-sm text-gray-600 leading-relaxed">{result.summary}</p>}

            {result.totalCompNote && (
              <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(0,0,0,0.025)", color: "#57534E" }}>
                <span className="font-semibold text-gray-700">Beyond base: </span>{result.totalCompNote}
              </div>
            )}

            {result.factors.length > 0 && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">What moves you up the range</p>
                <ul className="space-y-1.5">
                  {result.factors.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span style={{ color: "#EA580C" }}>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-5 text-xs text-gray-400">
              Estimates for orientation only — actual offers vary by employer, project, and market conditions.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
