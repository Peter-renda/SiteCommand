"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LESSONS,
  TRACK_LABELS,
  lessonsByTrack,
  lessonCategories,
  type LessonTrack,
} from "@/lib/training-lessons";

/**
 * Training → Modules: the module library. A browsable list grouped by track →
 * category; each module is a hyperlink that opens the lesson (text + graded
 * quiz) in a new tab. Per-module completion checkmarks and quiz grades are
 * loaded per-user, so a grade recorded on a lesson page shows up here.
 */

type QuizResult = { score: number; total: number; bestScore: number; attempts: number };

// A module counts as complete once its quiz is passed at 75% or higher.
const PASS_RATIO = 0.75;
const isPassed = (r: QuizResult | undefined) =>
  !!r && r.total > 0 && r.bestScore / r.total >= PASS_RATIO;

export default function LessonsClient() {
  const [track, setTrack] = useState<LessonTrack>("workflow");
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const quizRes = await fetch("/api/training/lessons/quiz");
      if (quizRes.ok) {
        const d = await quizRes.json();
        setQuizResults(d.results ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Modules open in a new tab, so completions/grades are earned while this
  // list tab sits in the background. Silently refetch when the user comes
  // back so the checkmarks and grade badges are never stale.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const trackLessons = useMemo(() => lessonsByTrack(track), [track]);
  const categories = useMemo(() => lessonCategories(track), [track]);

  const overallCompleted = LESSONS.filter((l) => isPassed(quizResults[l.id])).length;
  const takenResults = LESSONS.map((l) => quizResults[l.id]).filter(Boolean) as QuizResult[];
  const quizzedCount = takenResults.length;
  const gradePoints = takenResults.reduce((s, r) => s + r.bestScore, 0);
  const gradeTotal = takenResults.reduce((s, r) => s + r.total, 0);
  const avgGrade = gradeTotal > 0 ? Math.round((gradePoints / gradeTotal) * 100) : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Training Modules</h1>
      <p className="mt-1 text-sm text-gray-500 max-w-2xl">
        Read each module, then take the short quiz at the end — your grade is recorded here. The
        curriculum covers the SiteCommand workflows, the construction concepts behind them, and the
        deeper tracks: means &amp; methods, site &amp; civil, MEP systems, contracts, and
        professional skills.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-40 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all"
              style={{ width: `${LESSONS.length ? (overallCompleted / LESSONS.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {overallCompleted}/{LESSONS.length} modules complete
          </span>
        </div>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">
          {quizzedCount}/{LESSONS.length} quizzes taken
        </span>
        {avgGrade !== null && (
          <>
            <span className="text-xs text-gray-400">·</span>
            <span
              className={`text-xs font-medium ${avgGrade === 100 ? "text-green-600" : "text-gray-500"}`}
            >
              avg quiz grade {avgGrade}%
            </span>
          </>
        )}
      </div>

      {/* Track tabs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 text-[13px]">
        {(Object.keys(TRACK_LABELS) as LessonTrack[]).map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`rounded-md px-2 py-1.5 font-medium transition-colors ${
              track === t ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {TRACK_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Module list grouped by category */}
      <div className="mt-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {cat}
            </p>
            <div className="space-y-2">
              {trackLessons
                .filter((l) => l.category === cat)
                .map((l) => {
                  const result = quizResults[l.id];
                  const passed = isPassed(result);
                  const percent = result
                    ? Math.round((result.bestScore / result.total) * 100)
                    : null;
                  return (
                    <a
                      key={l.id}
                      href={`/training/lessons/${l.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-gray-400 hover:shadow-sm transition-all"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                          passed
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-300 text-transparent"
                        }`}
                        title={passed ? "Passed" : "Not passed"}
                      >
                        ✓
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 group-hover:underline">
                            {l.title}
                          </span>
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 5h5v5M19 5l-9 9M9 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-3"
                            />
                          </svg>
                        </div>
                        <p className="mt-0.5 text-[13px] leading-5 text-gray-500 line-clamp-2">
                          {l.summary}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">{l.minutes} min read</p>
                      </div>
                      <span className="shrink-0 self-center">
                        {loading ? null : result ? (
                          <span
                            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                              passed
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {percent}%
                          </span>
                        ) : (
                          <span className="rounded-md border border-dashed border-gray-200 px-2 py-1 text-[11px] text-gray-400">
                            Quiz not taken
                          </span>
                        )}
                      </span>
                    </a>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
