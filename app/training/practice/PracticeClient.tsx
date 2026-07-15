"use client";

import { useCallback, useEffect, useState } from "react";
import { roleLabel, projectTypeLabel, type SimRole } from "@/lib/simulation-constants";
import TrainingLauncher from "./TrainingLauncher";

/**
 * Training → Practice: launcher for "SiteCommand Training" sandbox projects.
 *
 * The user picks a role and a project type, then launches a real, sandboxed
 * SiteCommand project that opens in a new tab. From there they run the whole
 * project with the actual tools. (The old text-based, day-by-day grading game —
 * with its scoring frequency and speed settings — has been replaced by this
 * hands-on sandbox.)
 */

type TrainingProject = {
  id: string;
  name: string;
  status: string;
  training_role: SimRole | null;
  training_project_type: string | null;
  training_day: number;
  training_last_saved_at: string | null;
  created_at: string;
  archived_at: string | null;
};

function lastSavedLabel(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "Last saved just now";
  const m = Math.round(s / 60);
  if (m < 60) return `Last saved ${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `Last saved ${h} hr ago`;
  return `Last saved ${new Date(iso).toLocaleDateString()}`;
}

export default function PracticeClient({ username }: { username: string }) {
  const [projects, setProjects] = useState<TrainingProject[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Archived (soft-deleted) sandboxes — shown when the user opens the "Archived
  // projects" view. Loaded lazily the first time it's opened and refreshed on
  // archive/recover so the two lists stay in sync.
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<TrainingProject[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoadingList(true);
    try {
      // no-store so a freshly-deleted/launched sandbox is never masked by a
      // cached list response.
      const res = await fetch("/api/training/projects", { cache: "no-store" });
      const data = await res.json();
      setProjects(data.projects ?? []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadArchived = useCallback(async () => {
    setLoadingArchived(true);
    try {
      const res = await fetch("/api/training/projects?archived=true", { cache: "no-store" });
      const data = await res.json();
      setArchived(data.projects ?? []);
    } finally {
      setLoadingArchived(false);
    }
  }, []);

  // Archiving a sandbox: drop it from the active list immediately, and refresh
  // the archived list so it shows up there (if that view is/becomes open).
  const handleArchived = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      loadArchived();
    },
    [loadArchived],
  );

  // Recovering a sandbox: drop it from the archived list and refresh the active
  // list so it returns to "Your training projects".
  const handleRecovered = useCallback(
    (id: string) => {
      setArchived((prev) => prev.filter((p) => p.id !== id));
      loadProjects();
    },
    [loadProjects],
  );

  // Permanently deleting an archived sandbox: just drop it from the archived list.
  const removeArchivedFromList = useCallback((id: string) => {
    setArchived((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    loadProjects();
    // Load archived too so the count badge is accurate on first paint (without
    // requiring the user to open the archived view first).
    loadArchived();
  }, [loadProjects, loadArchived]);

  function toggleArchived() {
    setShowArchived((open) => {
      const next = !open;
      if (next) loadArchived();
      return next;
    });
  }

  const firstName = (username || "there").split(/[\s.@]/)[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Project Simulation</h1>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Run a simulated construction project end to end, {firstName}. Pick your role and a project
          type, then launch a hands-on <span className="font-medium text-gray-700">SiteCommand
          Training</span> sandbox — a real, private copy of SiteCommand that opens in a new tab.
          Fake emails, plans, and specs come through as you go, so you can practice running the whole
          job.
        </p>
      </div>

      {/* New sandbox */}
      <TrainingLauncher onLaunched={loadProjects} className="mb-8" />

      {/* Existing sandboxes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Your training projects</h2>
          <button
            type="button"
            onClick={toggleArchived}
            aria-pressed={showArchived}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showArchived
                ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4" />
            </svg>
            {showArchived ? "Hide archived" : "Archived projects"}
            {!showArchived && archived.length > 0 && (
              <span className="ml-0.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                {archived.length}
              </span>
            )}
          </button>
        </div>

        {showArchived ? (
          <div>
            <p className="mb-3 text-xs text-gray-500">
              Deleted training projects are kept here. Recover one to return it to your active list.
            </p>
            {loadingArchived ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : archived.length === 0 ? (
              <p className="text-sm text-gray-400">No archived training projects.</p>
            ) : (
              <div className="space-y-2">
                {archived.map((p) => (
                  <ArchivedRow
                    key={p.id}
                    project={p}
                    onRecovered={handleRecovered}
                    onDeleted={removeArchivedFromList}
                  />
                ))}
              </div>
            )}
          </div>
        ) : loadingList ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-400">No training projects yet. Launch one above.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} onDeleted={handleArchived} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  onDeleted,
}: {
  project: TrainingProject;
  onDeleted: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/training/projects/${project.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete training project");
      }
      // Server confirmed the row was removed. Drop it from the list right away
      // (the row unmounts), so we never depend on a reload that could be served
      // a stale, cached copy still containing this project. `deleting` stays set
      // to avoid a state update after unmount.
      onDeleted(project.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete training project");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const meta = [
    project.training_role ? roleLabel(project.training_role) : null,
    project.training_project_type ? projectTypeLabel(project.training_project_type) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="group flex items-center">
        {/* Expand toggle — outside the anchor so it never triggers navigation */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide phase reviews" : "Show phase reviews"}
          title={expanded ? "Hide phase reviews" : "Show phase reviews"}
          className="shrink-0 py-4 pl-3 pr-1 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <a
          href={`/projects/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 flex items-center gap-4 py-4 pr-2 pl-1"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {[meta, lastSavedLabel(project.training_last_saved_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-500 group-hover:text-gray-900">
            Open ↗
          </span>
        </a>
        {/* Delete button is outside the anchor so clicks never trigger navigation */}
        {confirmDelete ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3">
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
              disabled={deleting}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-gray-300 hover:text-red-500 transition-colors px-3 py-4"
            title="Delete sandbox (moves to Archived projects)"
          >
            ✕
          </button>
        )}
      </div>
      {expanded && <ReviewsPanel projectId={project.id} />}
      {deleteError && (
        <p className="px-4 pb-3 text-xs text-red-600">{deleteError}</p>
      )}
    </div>
  );
}

function archivedLabel(iso: string | null): string {
  if (!iso) return "Archived";
  return `Archived ${new Date(iso).toLocaleDateString()}`;
}

/**
 * A row in the "Archived projects" view: a soft-deleted sandbox the user can
 * Recover (back to the active list) or Delete permanently (hard delete for good).
 */
function ArchivedRow({
  project,
  onRecovered,
  onDeleted,
}: {
  project: TrainingProject;
  onRecovered: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [recovering, setRecovering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recover() {
    setRecovering(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recover" }),
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to recover training project");
      }
      onRecovered(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recover training project");
      setRecovering(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/projects/${project.id}?permanent=true`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete training project");
      }
      onDeleted(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete training project");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const meta = [
    project.training_role ? roleLabel(project.training_role) : null,
    project.training_project_type ? projectTypeLabel(project.training_project_type) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const busy = recovering || deleting;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60">
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">{project.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {[meta, archivedLabel(project.archived_at)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {confirmDelete ? (
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setError(null); }}
              disabled={busy}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={recover}
              disabled={busy}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {recovering ? "Recovering…" : "Recover"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="text-xs font-medium text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
              title="Delete permanently"
            >
              Delete permanently
            </button>
          </div>
        )}
      </div>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}

type SavedReview = {
  id: string;
  phase: string;
  day: number;
  completed: unknown[];
  missed: unknown[];
  closed_out: boolean;
  updated_at: string;
};

/**
 * Expanded under a training project row: the sandbox's saved phase Job Reviews.
 * Each links to the review page in a new tab. Reviews are persisted server-side
 * (training_phase_reviews), so they survive reloads and appear here regardless of
 * which browser generated them.
 */
function ReviewsPanel({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/training/projects/${projectId}/reviews`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load reviews");
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Phase reviews
      </p>
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">
          No saved reviews yet. A Job Review is saved here each time you complete a phase in the
          sandbox.
        </p>
      ) : (
        <div className="space-y-1.5">
          {reviews.map((r) => {
            const done = Array.isArray(r.completed) ? r.completed.length : 0;
            const miss = Array.isArray(r.missed) ? r.missed.length : 0;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2 transition-colors hover:border-gray-300 hover:bg-white"
              >
                <a
                  href={`/training/review?project=${projectId}&day=${r.day}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/review flex min-w-0 flex-1 items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{r.phase}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {done} completed · {miss} missed
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.closed_out ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.closed_out ? "Closed out" : "Open"}
                  </span>
                </a>
                {/* Opens the review as a stored PDF in a new tab (generated + saved
                    on first open, re-served from storage thereafter). */}
                <a
                  href={`/api/training/projects/${projectId}/reviews/${r.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open this Job Review as a PDF"
                  className="flex shrink-0 items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
                  </svg>
                  PDF ↗
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
