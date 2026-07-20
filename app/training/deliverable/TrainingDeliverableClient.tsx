"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTrainingDeliverable,
  resolveDeliverableRecipients,
  gradeBadgeClass,
} from "@/lib/training-deliverables";
import { getTrainingSchedule } from "@/lib/training-schedule";

/**
 * The deliverable workspace: download the template → fill it out → submit the
 * completed workbook. Submitting stores the file, sends the simulated
 * follow-up email (when the deliverable defines one), AI-grades the workbook,
 * and shows the grade + per-criterion feedback. Resubmitting regrades in
 * place. On a successful grade the matching Day-panel task is checked off via
 * localStorage (the project tab picks it up through the cross-tab storage
 * event, same as meetings).
 */

type CriterionResult = { id: string; title: string; met: boolean; note: string };

type Submission = {
  deliverableId: string;
  day: number;
  fileName: string;
  note: string;
  sentTo: { key: string; name: string; company: string }[];
  score: number | null;
  letter: string;
  feedback: {
    summary?: string;
    strengths?: string[];
    gaps?: string[];
    criteria?: CriterionResult[];
    degraded?: boolean;
  };
  attempts: number;
  gradedAt: string | null;
};

function readJSON<T>(key: string, fallbackValue: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore unavailable storage */
  }
}

export default function TrainingDeliverableClient({
  projectId,
  deliverableId,
  projectName,
  projectType,
}: {
  projectId: string;
  deliverableId: string;
  projectName: string;
  projectType: string | null;
}) {
  const deliverable = useMemo(() => getTrainingDeliverable(deliverableId), [deliverableId]);
  const recipients = useMemo(
    () => (deliverable ? resolveDeliverableRecipients(deliverable, projectType) : []),
    [deliverable, projectType],
  );
  const hasEmailStep = !!deliverable?.followUp && recipients.length > 0;

  const apiBase = `/api/training/projects/${projectId}/deliverables/${deliverableId}`;

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Restore a prior submission (grade view) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiBase, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSubmission(data.submission ?? null);
        }
      } catch {
        /* fresh view */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  // Check the matching Day-panel task off once graded (cross-tab via storage event).
  const markTaskComplete = useCallback(() => {
    if (!deliverable) return;
    const day = getTrainingSchedule(deliverable.role).find((d) => d.day === deliverable.day);
    const idx = day?.tasks.findIndex((t) => t.task === deliverable.taskMatch) ?? -1;
    if (idx < 0) return;
    const tasksKey = `sc-training-tasks-${projectId}`;
    const checks = readJSON<Record<string, boolean>>(tasksKey, {});
    if (!checks[`${deliverable.day}-${idx}`]) {
      checks[`${deliverable.day}-${idx}`] = true;
      writeJSON(tasksKey, checks);
    }
  }, [deliverable, projectId]);

  const handleSubmit = useCallback(async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (note.trim()) form.append("note", note.trim());
      const res = await fetch(apiBase, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Submission failed — please try again.");
      setSubmission(data.submission);
      setFile(null);
      setNote("");
      setResubmitOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      markTaskComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [apiBase, file, note, submitting, markTaskComplete]);

  if (!deliverable) return null;

  const graded = !!submission?.gradedAt;
  const score = submission?.score ?? 0;
  const feedback = submission?.feedback ?? {};

  const uploadCard = (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">
        {graded ? "Resubmit an updated workbook" : "Submit your completed workbook"}
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Upload the filled-out template (.xlsx or .csv).{" "}
        {graded ? "Resubmitting regrades and updates your recorded grade." : ""}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm,.csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-gray-800"
      />

      {hasEmailStep && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-900">✉️ Follow-up on submit</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
            {deliverable.followUp!.summary}
          </p>
          <p className="mt-1.5 text-[11px] text-amber-800">
            Your file will be emailed to:{" "}
            <span className="font-medium">
              {recipients.map((r) => `${r.name} (${r.company})`).join(", ")}
            </span>
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional message to include in the email…"
            className="mt-2 w-full rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none"
          />
        </div>
      )}
      {!hasEmailStep && (
        <p className="mt-3 text-[11px] text-gray-500">
          No email step for this deliverable — it grades on submit and files to your project record.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || submitting}
        className="mt-4 w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
      >
        {submitting
          ? hasEmailStep
            ? "Sending & grading…"
            : "Grading…"
          : hasEmailStep
            ? "Submit, send & grade →"
            : "Submit & grade →"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Deliverable · Day {deliverable.day} · {projectName}
              </p>
              <h1 className="mt-1 text-lg font-semibold text-gray-900">{deliverable.title}</h1>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{deliverable.taskMatch}</p>
            </div>
            {graded && submission && submission.score != null && (
              <div className="text-right">
                <span
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xl font-bold ${gradeBadgeClass(score)}`}
                >
                  {submission.letter}
                </span>
                <p className="mt-1 text-[11px] text-gray-400">
                  {submission.score}/100 · attempt {submission.attempts}
                </p>
              </div>
            )}
          </div>

          <a
            href={deliverable.templateFile}
            download
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            ⬇ Download {deliverable.templateLabel}
          </a>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">How to complete it</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-gray-700">
            {deliverable.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {deliverable.columns.map((c) => (
              <span
                key={c}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-xs text-gray-400">
            Loading…
          </div>
        ) : graded && submission ? (
          <>
            {/* Grade + feedback */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Grade & feedback</h2>
                {feedback.degraded && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    auto-graded
                  </span>
                )}
              </div>
              {feedback.summary && (
                <p className="mt-2 text-xs leading-relaxed text-gray-700">{feedback.summary}</p>
              )}

              {(feedback.criteria ?? []).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {(feedback.criteria ?? []).map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${c.met ? "bg-green-500" : "bg-red-400"}`}
                      >
                        {c.met ? "✓" : "✕"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800">{c.title}</p>
                        <p className="text-[11px] leading-snug text-gray-500">{c.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {(feedback.gaps ?? []).length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500">To improve</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(feedback.gaps ?? []).map((g, i) => (
                      <span
                        key={i}
                        className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                <span>
                  Submitted: <span className="font-medium text-gray-700">{submission.fileName}</span>
                </span>
                <a
                  href={`${apiBase}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  open file ↗
                </a>
                {submission.sentTo.length > 0 && (
                  <a
                    href={`/projects/${projectId}/emails`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    view the sent email in project Emails ↗
                  </a>
                )}
              </div>
            </div>

            {resubmitOpen ? (
              uploadCard
            ) : (
              <button
                type="button"
                onClick={() => setResubmitOpen(true)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Improve & resubmit
              </button>
            )}
          </>
        ) : (
          uploadCard
        )}
      </div>
    </div>
  );
}
