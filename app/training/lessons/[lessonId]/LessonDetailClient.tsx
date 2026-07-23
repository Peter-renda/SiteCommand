"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { lessonsByTrack, getLesson, TRACK_LABELS, type Lesson } from "@/lib/training-lessons";
// Type-only import: the quiz module holds the correct answers, so it must NOT
// be bundled into client JS. `import type` is erased at compile time.
import type { PublicQuiz } from "@/lib/training-lesson-quizzes";

/**
 * A single Training Module: the lesson text followed by a graded quiz.
 * Completion state and quiz grades persist per-user via the training APIs.
 *
 * Two rendering modes:
 *  - Standalone page (`/training/lessons/[lessonId]`): back/related/prev/next
 *    are real hyperlinks.
 *  - Inline on the Training Modules list: pass `onBack` / `onNavigate` and the
 *    same controls become buttons that swap the lesson in place (no new tab).
 *    `onGraded` lets the list refresh its grade badges after a quiz submit.
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
  onBack,
  onNavigate,
  onGraded,
}: {
  lesson: Lesson;
  quiz: PublicQuiz | null;
  /** Inline mode: render "All Training Modules" as a button calling this. */
  onBack?: () => void;
  /** Inline mode: render related/prev/next as buttons that swap the lesson. */
  onNavigate?: (lessonId: string) => void;
  /** Inline mode: called after a quiz is graded so the list can refresh. */
  onGraded?: () => void;
}) {
  // Quiz state: one selected option index per question (-1 = unanswered).
  const [answers, setAnswers] = useState<number[]>(() =>
    quiz ? quiz.questions.map(() => -1) : [],
  );
  const [grade, setGrade] = useState<Grade | null>(null);
  const [priorBest, setPriorBest] = useState<{ bestScore: number; total: number } | null>(null);
  const [grading, setGrading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Load this lesson's prior quiz result on mount.
  const load = useCallback(async () => {
    try {
      const quizRes = await fetch("/api/training/lessons/quiz");
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

  // Inline mode swaps the lesson without remounting, so clear the previous
  // lesson's quiz answers/grade whenever the lesson changes.
  useEffect(() => {
    setAnswers(quiz ? quiz.questions.map(() => -1) : []);
    setGrade(null);
    setPriorBest(null);
    setQuizError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

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
      onGraded?.();
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

  // A quiz is passed at 75% or higher.
  const passed = grade ? grade.score / grade.total >= 0.75 : false;

  return (
    <div className="max-w-3xl">
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← All Training Modules
        </button>
      ) : (
        <a
          href="/training/lessons"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← All Training Modules
        </a>
      )}

      <div className="card card-pad mt-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {TRACK_LABELS[lesson.track]} · {lesson.category} · {lesson.minutes} min read
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">{lesson.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{lesson.summary}</p>
          </div>
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

        {lesson.products && lesson.products.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Common products & materials
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Representative product categories for this trade. Each links to
              manufacturer spec sheets, data sheets, and CAD/BIM on ARCAT.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lesson.products.map((p) => (
                <a
                  key={p.name}
                  href={p.specUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-white">
                    <ProductIcon name={p.icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-gray-900">
                        {p.name}
                      </p>
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {p.csi}
                    </p>
                    <p className="mt-1 text-[12px] leading-4 text-gray-600">{p.description}</p>
                    <span className="mt-1.5 inline-block text-[11px] font-medium text-gray-900 group-hover:underline">
                      View spec sheets on ARCAT →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {lesson.relatedLessonIds && lesson.relatedLessonIds.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Related modules
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.relatedLessonIds.map((rid) => {
                const rl = getLesson(rid);
                if (!rl) return null;
                const cls =
                  "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors";
                return onNavigate ? (
                  <button key={rid} onClick={() => onNavigate(rid)} className={cls}>
                    {rl.title}
                  </button>
                ) : (
                  <a key={rid} href={`/training/lessons/${rid}`} className={cls}>
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
                {passed ? "Passed!" : "Not passed"} — {grade.score}/{grade.total} (
                {Math.round((grade.score / grade.total) * 100)}%)
              </span>
              <span className="text-xs text-gray-400">
                Attempt {grade.attempts} · Your grade has been recorded.
              </span>
              <div className="ml-auto flex items-center gap-2">
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
          onNavigate ? (
            <button
              onClick={() => onNavigate(prev.id)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← {prev.title}
            </button>
          ) : (
            <a
              href={`/training/lessons/${prev.id}`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← {prev.title}
            </a>
          )
        ) : (
          <span />
        )}
        {next ? (
          onNavigate ? (
            <button
              onClick={() => onNavigate(next.id)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors text-right"
            >
              {next.title} →
            </button>
          ) : (
            <a
              href={`/training/lessons/${next.id}`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors text-right"
            >
              {next.title} →
            </a>
          )
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

/**
 * Self-contained inline-SVG "pictures" for the Common Products gallery. Each
 * key maps to a schematic line glyph of a common construction product, so the
 * cards always render (no external image hotlinking / link rot). Unknown keys
 * fall back to a generic product box.
 */
const PRODUCT_ICONS: Record<string, ReactNode> = {
  "concrete-mix": <path d="M8 5c1.3-.8 6.7-.8 8 0l-1 15H9z M9.5 9h5" />,
  rebar: <path d="M4 8h16 M4 14h16 M8 4v16 M14 4v16" />,
  formwork: <path d="M4 5h16v14H4z M9 5v14 M15 5v14 M4 10h16" />,
  grout: <path d="M6 8h12l-1.5 11h-9z M6 8c0-2 12-2 12 0" />,
  "steel-beam": <path d="M6 5h12 M6 19h12 M12 5v14" />,
  "steel-deck": <path d="M3 14l3-4 3 4 3-4 3 4 3-4 3 4 M3 18h18" />,
  fastener: <path d="M8 6h8l3 6-3 6H8l-3-6z M12 9v6 M9.5 12h5" />,
  railing: <path d="M3 20h18 M5 20V9 M19 20V9 M5 9h14 M5 13h14" />,
  "cmu-block": <path d="M3 7h18v10H3z M6 10h4v4H6z M14 10h4v4h-4z" />,
  brick: <path d="M3 8h18 M3 12h18 M3 16h18 M8 8v4 M15 8v4 M5 12v4 M12 12v4 M19 12v4" />,
  lumber: <path d="M4 6h16v4H4z M4 13h16v4H4z M8 6v4 M8 13v4 M14 6v4 M14 13v4" />,
  "metal-stud": <path d="M15 4H9v16h6 M9 9h3 M9 15h3" />,
  roofing: <path d="M3 16l9-8 9 8 M3 16v3h18v-3 M9 12h6" />,
  insulation: <path d="M4 6h16v12H4z M4 9c4 0 4 3 8 3s4-3 8-3 M4 13c4 0 4 3 8 3s4-3 8-3" />,
  barrier: <path d="M6 4h9l3 3v13H6z M15 4v3h3 M9 11h6 M9 14h6 M9 17h4" />,
  door: <path d="M6 4h12v16H6z M15 12h.01" />,
  "curtain-wall": <path d="M4 4h16v16H4z M12 4v16 M4 12h16" />,
  sprinkler: <path d="M8 9h8 M12 4v5 M9 9l-1.5 4 M12 9v4 M15 9l1.5 4" />,
  pump: <path d="M10 13a5 5 0 100-.01 M10 13l3-4 M13 8h5v5" />,
  valve: <path d="M4 8v8l7-4z M20 8v8l-7-4z M12 12V6 M9 6h6" />,
  extinguisher: <path d="M9 7h6v12H9z M11 7V5h2v2 M13 5h3v3" />,
  pipe: <path d="M3 10h13v4H3z M16 8h4v8h-4z" />,
  "water-heater": <path d="M7 5a3 3 0 016 0v12a3 3 0 01-6 0z M9 9h6 M9 5V3 M13 5V3" />,
  "hvac-unit": <path d="M3 7h18v10H3z M8 12a2.5 2.5 0 100-.01 M14 10h4 M14 12h4 M14 14h4" />,
  duct: <path d="M3 8h12l6 4-6 4H3z M9 8v8" />,
  panelboard: <path d="M6 3h12v18H6z M9 7h2 M13 7h2 M9 10h2 M13 10h2 M9 13h2 M13 13h2" />,
  light: <path d="M4 8h16v8H4z M8 8v8 M12 8v8 M16 8v8" />,
  drywall: (
    <>
      <path d="M4 4h16v16H4z" />
      <circle cx="7" cy="7" r="0.5" />
      <circle cx="17" cy="7" r="0.5" />
      <circle cx="7" cy="17" r="0.5" />
      <circle cx="17" cy="17" r="0.5" />
    </>
  ),
  ceiling: <path d="M4 4h16v16H4z M4 12h16 M12 4v16 M8 4v16 M16 4v16 M4 8h16 M4 16h16" />,
  flooring: <path d="M3 6h18v12H3z M3 10h18 M3 14h18 M9 6v4 M15 10v4 M6 14v4 M18 14v4" />,
  paint: <path d="M5 5h9v4H5z M10 9v2H8v9 M14 6h4v4h-4z" />,
  tile: <path d="M4 4h16v16H4z M4 9h16 M4 14h16 M9 4v16 M14 4v16" />,
  elevator: <path d="M5 3h14v18H5z M12 3v18 M9 8l-1.5 2h3z M15 12l-1.5-2h3z" />,
  cabling: <path d="M6 7h12v9H6z M9 7V5h6v2 M9 16v3 M15 16v3" />,
  camera: <path d="M4 8h11l4 2v3l-4 2H4z M9 11a2 2 0 100-.01 M12 15v3H9" />,
  keypad: <path d="M7 3h10v18H7z M10 7h1 M13 7h1 M10 10h1 M13 10h1 M10 13h1 M13 13h1 M12 17h.01" />,
  excavator: <path d="M3 20h10 M4 12h7v5H4z M11 13l5-4 M16 9l1.5 4-4 1" />,
  "wall-block": <path d="M3 8h18 M3 12h18 M3 16h18 M6 16v-4 M12 16v-4 M9 12V8 M15 12V8" />,
  paver: <path d="M4 4h16v16H4z M12 4v6 M4 10h8 M12 14h8 M12 10v10" />,
  hydrant: <path d="M12 6a2 2 0 100-.01 M9 8h6v10H9z M9 12H6 M15 12h3 M10 20h4 M12 18v2" />,
  default: <path d="M4 4h16v16H4z M4 9h16" />,
};

function ProductIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PRODUCT_ICONS[name] ?? PRODUCT_ICONS.default}
    </svg>
  );
}
