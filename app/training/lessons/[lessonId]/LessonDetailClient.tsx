"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { lessonsByTrack, getLesson, TRACK_LABELS, type Lesson } from "@/lib/training-lessons";
// Type-only import: the quiz module holds the correct answers, so it must NOT
// be bundled into client JS. `import type` is erased at compile time.
import type { PublicQuiz } from "@/lib/training-lesson-quizzes";

/**
 * A single Training Module: the lesson text followed by a graded quiz. Opened
 * in its own tab from the Training Modules list. Completion state and quiz
 * grades persist per-user via the training APIs, so a grade recorded here shows
 * up back on the Training Modules page.
 */

type Grade = {
  score: number;
  total: number;
  correct: boolean[];
  correctAnswers: number[];
  bestScore: number;
  attempts: number;
};

export default function LessonDetailClient({
  lesson,
  quiz,
}: {
  lesson: Lesson;
  quiz: PublicQuiz | null;
}) {
  const [completed, setCompleted] = useState(false);
  const [savingComplete, setSavingComplete] = useState(false);

  // Quiz state: one selected option index per question (-1 = unanswered).
  const [answers, setAnswers] = useState<number[]>(() =>
    quiz ? quiz.questions.map(() => -1) : [],
  );
  const [grade, setGrade] = useState<Grade | null>(null);
  const [priorBest, setPriorBest] = useState<{ bestScore: number; total: number } | null>(null);
  const [grading, setGrading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Load this lesson's completion + any prior quiz result on mount.
  const load = useCallback(async () => {
    try {
      const [progressRes, quizRes] = await Promise.all([
        fetch("/api/training/lessons/progress"),
        fetch("/api/training/lessons/quiz"),
      ]);
      if (progressRes.ok) {
        const d = await progressRes.json();
        setCompleted((d.completedIds ?? []).includes(lesson.id));
      }
      if (quizRes.ok) {
        const d = await quizRes.json();
        const r = d.results?.[lesson.id];
        if (r) setPriorBest({ bestScore: r.bestScore, total: r.total });
      }
    } catch {
      /* non-fatal — the page still works without prior state */
    }
  }, [lesson.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleComplete() {
    if (savingComplete) return;
    setSavingComplete(true);
    const willComplete = !completed;
    setCompleted(willComplete); // optimistic
    try {
      const res = await fetch("/api/training/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, completed: willComplete }),
      });
      if (!res.ok) setCompleted(!willComplete); // revert on failure
    } catch {
      setCompleted(!willComplete);
    } finally {
      setSavingComplete(false);
    }
  }

  async function submitQuiz() {
    if (!quiz || grading) return;
    setQuizError(null);
    if (answers.some((a) => a < 0)) {
      setQuizError("Answer every question before submitting.");
      return;
    }
    setGrading(true);
    try {
      const res = await fetch("/api/training/lessons/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, answers }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setQuizError(d.error ?? "Couldn't grade the quiz. Try again.");
        return;
      }
      const g: Grade = await res.json();
      setGrade(g);
      setPriorBest({ bestScore: g.bestScore, total: g.total });
    } catch {
      setQuizError("Couldn't reach the server. Try again.");
    } finally {
      setGrading(false);
    }
  }

  function retake() {
    setGrade(null);
    setQuizError(null);
    setAnswers(quiz ? quiz.questions.map(() => -1) : []);
  }

  // Prev/next within the same track.
  const trackLessons = useMemo(() => lessonsByTrack(lesson.track), [lesson.track]);
  const idx = trackLessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? trackLessons[idx - 1] : null;
  const next = idx >= 0 && idx < trackLessons.length - 1 ? trackLessons[idx + 1] : null;

  const passed = grade ? grade.score === grade.total : false;

  return (
    <div className="max-w-3xl">
      <a
        href="/training/lessons"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← All Training Modules
      </a>

      <div className="card card-pad mt-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {TRACK_LABELS[lesson.track]} · {lesson.category} · {lesson.minutes} min read
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">{lesson.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{lesson.summary}</p>
          </div>
          <button
            onClick={toggleComplete}
            disabled={savingComplete}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              completed
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {completed ? "✓ Completed" : "Mark complete"}
          </button>
        </div>

        {lesson.keyTerms && lesson.keyTerms.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Key terms
            </p>
            <dl className="mt-2 space-y-1.5">
              {lesson.keyTerms.map((kt) => (
                <div key={kt.term} className="text-[13px] leading-5">
                  <dt className="inline font-semibold text-amber-900">{kt.term}</dt>
                  <dd className="inline text-amber-900/80"> — {kt.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-5 space-y-5">
          {lesson.body.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h2 className="text-[15px] font-semibold text-gray-900">{block.heading}</h2>
              )}
              {block.paragraphs?.map((p, pi) => (
                <p key={pi} className="mt-2 text-sm leading-6 text-gray-600">
                  {p}
                </p>
              ))}
              {block.bullets && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm leading-6 text-gray-600">
                  {block.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
              {block.ordered && (
                <ol className="mt-2 space-y-1.5 list-decimal pl-5 text-sm leading-6 text-gray-600">
                  {block.ordered.map((o, oi) => (
                    <li key={oi}>{o}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>

        {lesson.relatedLessonIds && lesson.relatedLessonIds.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Related modules
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.relatedLessonIds.map((rid) => {
                const rl = getLesson(rid);
                if (!rl) return null;
                return (
                  <a
                    key={rid}
                    href={`/training/lessons/${rid}`}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {rl.title}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {lesson.links && lesson.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {lesson.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-900 hover:underline"
              >
                {link.label} →
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────── Quiz ─────────────────────────── */}
      {quiz && quiz.questions.length > 0 && (
        <div className="card card-pad mt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quiz</h2>
              <p className="mt-1 text-sm text-gray-500">
                Answer all {quiz.questions.length} questions, then submit to record your grade.
              </p>
            </div>
            {priorBest && (
              <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Best: {priorBest.bestScore}/{priorBest.total}
              </span>
            )}
          </div>

          <ol className="mt-4 space-y-5">
            {quiz.questions.map((q, qi) => {
              const chosen = answers[qi];
              const graded = grade !== null;
              const correctIdx = graded ? grade!.correctAnswers[qi] : -1;
              return (
                <li key={qi}>
                  <p className="text-sm font-medium text-gray-900">
                    {qi + 1}. {q.prompt}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = chosen === oi;
                      let stateClass = "border-gray-200 hover:border-gray-300";
                      if (graded) {
                        if (oi === correctIdx)
                          stateClass = "border-green-400 bg-green-50";
                        else if (selected && oi !== correctIdx)
                          stateClass = "border-red-400 bg-red-50";
                        else stateClass = "border-gray-200 opacity-70";
                      } else if (selected) {
                        stateClass = "border-gray-900 bg-gray-50";
                      }
                      return (
                        <label
                          key={oi}
                          className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-[13px] leading-5 transition-colors ${
                            graded ? "cursor-default" : "cursor-pointer"
                          } ${stateClass}`}
                        >
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            className="mt-0.5"
                            checked={selected}
                            disabled={graded}
                            onChange={() =>
                              setAnswers((prev) => {
                                const nextArr = [...prev];
                                nextArr[qi] = oi;
                                return nextArr;
                              })
                            }
                          />
                          <span className="text-gray-700">{opt}</span>
                          {graded && oi === correctIdx && (
                            <span className="ml-auto shrink-0 text-[11px] font-semibold uppercase text-green-700">
                              Correct
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>

          {quizError && <p className="mt-3 text-xs text-red-600">{quizError}</p>}

          {grade ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <span
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  passed
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {passed ? "Perfect score!" : "Graded"} — {grade.score}/{grade.total} (
                {Math.round((grade.score / grade.total) * 100)}%)
              </span>
              <span className="text-xs text-gray-400">
                Attempt {grade.attempts} · Your grade has been recorded.
              </span>
              <div className="ml-auto flex items-center gap-2">
                {/* The Mark complete toggle lives at the top of a long page —
                    offer it again here, where the user actually finishes. */}
                {!completed && (
                  <button
                    onClick={toggleComplete}
                    disabled={savingComplete}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Mark module complete
                  </button>
                )}
                <button
                  onClick={retake}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <button
                onClick={submitQuiz}
                disabled={grading}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {grading ? "Grading…" : "Submit quiz"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prev / next within the track */}
      <div className="mt-5 flex items-center justify-between">
        {prev ? (
          <a
            href={`/training/lessons/${prev.id}`}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            href={`/training/lessons/${next.id}`}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors text-right"
          >
            {next.title} →
          </a>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
