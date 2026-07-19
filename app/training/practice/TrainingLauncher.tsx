"use client";

import { useState } from "react";
import { ROLES, PROJECT_TYPES, type SimRole } from "@/lib/simulation-constants";

/**
 * The "Launch a training project" card — pick a role + project type + training
 * mode, then launch a real, training-flagged SiteCommand sandbox that opens in a
 * new tab. Shared by Training → Practice (`PracticeClient`) and the dashboard's
 * "Start a new project" launcher modal so both stay identical.
 *
 * `onLaunched(id)` fires after a sandbox is created (the new tab is already
 * opening) so the host can refresh its own project list / close a modal.
 */

// The launcher offers the project types that have seeded content packs today.
// Kept as a filtered list (rather than hardcoded) so more types can be
// re-introduced later without reworking the control — PROJECT_TYPES stays the
// source of truth for labels/order.
const LAUNCHABLE_TYPES = new Set(["higher_ed", "healthcare"]);
const OFFERED_TYPES = PROJECT_TYPES.filter((p) => LAUNCHABLE_TYPES.has(p.value));
const DEFAULT_TYPE = OFFERED_TYPES[0]?.value ?? "higher_ed";
const TRAINING_MODES = [
  { value: "guided", label: "Guided", disabled: false },
  { value: "unguided", label: "Unguided", disabled: true },
] as const;
const DEFAULT_MODE = "guided";

// Only the Project Manager experience is seeded today (directory + handoff
// email + Day-1 flow). Superintendent and Project Accounting aren't wired up
// yet, so their role cards render but are disabled with a "coming soon" hint.
const AVAILABLE_ROLES = new Set<SimRole>(["project_manager"]);

export default function TrainingLauncher({
  onLaunched,
  className,
}: {
  onLaunched?: (id: string) => void;
  className?: string;
}) {
  const [role, setRole] = useState<SimRole>("project_manager");
  const [projectType, setProjectType] = useState<string>(DEFAULT_TYPE);
  const [trainingMode, setTrainingMode] = useState<string>(DEFAULT_MODE);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setLaunching(true);
    setError(null);
    // Open the tab synchronously on click so popup blockers allow it; we point
    // it at the new sandbox once the server has created it.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch("/api/training/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, projectType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch training project");
      if (tab) tab.location.href = `/projects/${data.id}`;
      else window.open(`/projects/${data.id}`, "_blank");
      onLaunched?.(data.id);
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : "Failed to launch training project");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 sm:p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Launch a training project</h2>

      {/* Role */}
      <label className="block text-xs font-medium text-gray-500 mb-2">Your role</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {ROLES.map((r) => {
          const available = AVAILABLE_ROLES.has(r.value);
          const selected = role === r.value;
          return (
            <div key={r.value} className="relative group h-full">
              <button
                type="button"
                onClick={() => available && setRole(r.value)}
                aria-disabled={!available}
                tabIndex={available ? undefined : -1}
                className={`w-full h-full text-left rounded-lg border p-3.5 transition-colors ${
                  selected
                    ? "border-gray-900 bg-gray-900 text-white"
                    : available
                      ? "border-gray-200 hover:border-gray-300 bg-white"
                      : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                }`}
              >
                <p className={`text-sm font-medium ${selected ? "text-white" : "text-gray-900"}`}>
                  {r.label}
                </p>
                <p className={`mt-1 text-xs ${selected ? "text-gray-300" : "text-gray-500"}`}>
                  {r.blurb}
                </p>
              </button>
              {!available && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                >
                  Coming soon
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Project type and mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Project type</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            {OFFERED_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Training mode</label>
          <select
            value={trainingMode}
            onChange={(e) => setTrainingMode(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            {TRAINING_MODES.map((mode) => (
              <option key={mode.value} value={mode.value} disabled={mode.disabled}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {trainingMode === "guided" && (
        <div className="mb-5 max-w-2xl rounded-lg border border-blue-100 bg-blue-50 p-3.5 text-sm text-blue-950">
          <p className="font-medium">Guided training cadence</p>
          <p className="mt-1 text-xs leading-5 text-blue-900/80">
            Each day includes new emails and phone calls, tasks to complete, and end-of-day
            tests. After each week, you&apos;ll receive a score and a list of areas to improve.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        onClick={launch}
        disabled={launching}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {launching ? "Launching sandbox…" : "Launch training project ↗"}
      </button>
      <p className="mt-2 text-xs text-gray-400">Opens in a new tab.</p>
    </div>
  );
}
