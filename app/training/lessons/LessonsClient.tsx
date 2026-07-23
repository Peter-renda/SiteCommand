"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LESSONS,
  buildCurriculum,
  getLesson,
  subsectionSequence,
  type Lesson,
  type LessonTrack,
} from "@/lib/training-lessons";
import LessonDetailClient from "./[lessonId]/LessonDetailClient";
import TrainingPaywall from "../TrainingPaywall";
import { lessonRequiresUpgrade } from "@/lib/entitlement";
// Type-only: the quiz module holds the correct answers and must not be bundled
// into client JS. The answer-stripped PublicQuiz is fetched from the API.
import type { PublicQuiz } from "@/lib/training-lesson-quizzes";

/**
 * Training → Modules: the curriculum as a Section → Subsection tree.
 *
 * The left-hand nav tree lists every main section (track) and, nested under
 * it, its subsections (categories). Each subsection carries a completion
 * bubble that fills in once every module in it has a passing quiz grade — so
 * the tree reads like a normal training program's progress checklist. The
 * right pane shows the selected subsection's modules; once the subsection is
 * complete a "next section" button appears to move the learner forward.
 *
 * Per-module completion and grades are loaded per-user from the quiz API, so a
 * grade recorded on a module page (opened in a new tab) shows up here.
 */

type QuizResult = { score: number; total: number; bestScore: number; attempts: number };

// A module counts as complete once its quiz is passed at 75% or higher.
const PASS_RATIO = 0.75;
const isPassed = (r: QuizResult | undefined) =>
  !!r && r.total > 0 && r.bestScore / r.total >= PASS_RATIO;

type Active = { track: LessonTrack; category: string };

export default function LessonsClient({ fullAccess = true }: { fullAccess?: boolean }) {
  const curriculum = useMemo(() => buildCurriculum(), []);
  const sequence = useMemo(() => subsectionSequence(), []);
  const first = sequence[0];

  // Free accounts read the Pre-Construction & Entitlements section; every other
  // track is locked behind the upgrade wall.
  const isLocked = useCallback(
    (l: Lesson) => lessonRequiresUpgrade(l.track, fullAccess),
    [fullAccess],
  );

  const [active, setActive] = useState<Active>({
    track: first.track,
    category: first.category,
  });
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [loading, setLoading] = useState(true);

  // When a locked module is opened, show the upgrade wall instead of the reader.
  const [paywalled, setPaywalled] = useState(false);

  // Inline module reader: the selected module renders on this same page (no new
  // tab). Its answer-stripped quiz is fetched from the API per selection.
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<PublicQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  // Which sections are expanded in the tree. The active section starts open.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [first.track]: true,
  });

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

  // Open a module inline: fetch its answer-stripped quiz, then swap the list
  // for the reader and scroll to the top.
  const openLesson = useCallback((lessonId: string) => {
    const lesson = getLesson(lessonId);
    if (!lesson) return;
    // Locked module → show the upgrade wall instead of loading the reader.
    if (lessonRequiresUpgrade(lesson.track, fullAccess)) {
      setSelectedLessonId(null);
      setPaywalled(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedLessonId(lessonId);
    setSelectedQuiz(null);
    setQuizLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetch(`/api/training/lessons/public-quiz?lessonId=${encodeURIComponent(lessonId)}`)
      .then((r) => (r.ok ? r.json() : { quiz: null }))
      .then((d) => setSelectedQuiz(d.quiz ?? null))
      .catch(() => setSelectedQuiz(null))
      .finally(() => setQuizLoading(false));
  }, [fullAccess]);

  const closeLesson = useCallback(() => {
    setSelectedLessonId(null);
    setSelectedQuiz(null);
    setPaywalled(false);
    // Grades may have changed while reading; refresh the badges.
    void load();
  }, [load]);

  const selectedLesson = selectedLessonId ? getLesson(selectedLessonId) : null;

  // ── Completion helpers ──────────────────────────────────────────
  const lessonPassed = useCallback(
    (l: Lesson) => isPassed(quizResults[l.id]),
    [quizResults],
  );
  const subPassedCount = useCallback(
    (lessons: Lesson[]) => lessons.filter(lessonPassed).length,
    [lessonPassed],
  );
  const subComplete = useCallback(
    (lessons: Lesson[]) => lessons.length > 0 && subPassedCount(lessons) === lessons.length,
    [subPassedCount],
  );

  // ── Overall stats (top summary) ─────────────────────────────────
  const overallCompleted = LESSONS.filter(lessonPassed).length;
  const takenResults = LESSONS.map((l) => quizResults[l.id]).filter(Boolean) as QuizResult[];
  const quizzedCount = takenResults.length;
  const gradePoints = takenResults.reduce((s, r) => s + r.bestScore, 0);
  const gradeTotal = takenResults.reduce((s, r) => s + r.total, 0);
  const avgGrade = gradeTotal > 0 ? Math.round((gradePoints / gradeTotal) * 100) : null;

  // ── Active subsection ───────────────────────────────────────────
  const activeSection = curriculum.find((s) => s.track === active.track)!;
  const activeSub =
    activeSection.subsections.find((ss) => ss.category === active.category) ??
    activeSection.subsections[0];
  const activeLessons = activeSub.lessons;
  const activePassed = subPassedCount(activeLessons);
  const activeComplete = subComplete(activeLessons);

  const activeSeqIndex = sequence.findIndex(
    (s) => s.track === active.track && s.category === active.category,
  );
  const nextRef = sequence[activeSeqIndex + 1] ?? null;
  const nextSection = nextRef ? curriculum.find((s) => s.track === nextRef.track)! : null;
  const nextIsNewSection = !!nextRef && nextRef.track !== active.track;

  const contentRef = useRef<HTMLDivElement>(null);

  function goTo(next: Active) {
    setActive(next);
    setOpenSections((o) => ({ ...o, [next.track]: true }));
    // Bring the content pane back into view on smaller screens.
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // A locked module was opened — show the upgrade wall in place of the reader.
  if (paywalled) {
    return <TrainingPaywall onBack={closeLesson} />;
  }

  // Reading a module inline — the reader replaces the list until the user goes
  // back. Its quiz answers are graded server-side; onGraded refreshes badges.
  if (selectedLesson) {
    return (
      <div>
        {quizLoading ? (
          <p className="text-sm text-gray-400">Loading module…</p>
        ) : (
          <LessonDetailClient
            key={selectedLesson.id}
            lesson={selectedLesson}
            quiz={selectedQuiz}
            onBack={closeLesson}
            onNavigate={openLesson}
            onGraded={load}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Training Modules</h1>
      <p className="mt-1 text-sm text-gray-500 max-w-2xl">
        Work through each section and its subsections in order. Read the modules, pass the short
        quiz at the end of each, and watch the progress bubbles fill in — then move on to the next
        section.
      </p>

      {/* overall progress */}
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

      <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── Left: curriculum nav tree ── */}
        <nav className="w-full lg:w-64 shrink-0">
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Curriculum
          </p>
          <div className="space-y-0.5">
            {curriculum.map((section) => {
              const isOpen = !!openSections[section.track];
              const sectionLessons = section.subsections.flatMap((ss) => ss.lessons);
              const sectionPassed = subPassedCount(sectionLessons);
              const sectionComplete =
                sectionLessons.length > 0 && sectionPassed === sectionLessons.length;
              const isActiveSection = section.track === active.track;
              return (
                <div key={section.track}>
                  <button
                    onClick={() =>
                      setOpenSections((o) => ({ ...o, [section.track]: !o[section.track] }))
                    }
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`truncate ${isActiveSection ? "text-gray-900" : ""}`}>
                      {section.label}
                    </span>
                    <span
                      className={`ml-auto text-[10px] tabular-nums ${sectionComplete ? "text-green-600" : "text-gray-400"}`}
                    >
                      {sectionPassed}/{sectionLessons.length}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="ml-3.5 pl-2.5 border-l border-gray-200 space-y-0.5 py-0.5">
                      {section.subsections.map((sub) => {
                        const complete = subComplete(sub.lessons);
                        const passed = subPassedCount(sub.lessons);
                        const activeNode =
                          sub.track === active.track && sub.category === active.category;
                        return (
                          <button
                            key={sub.category}
                            onClick={() => goTo({ track: sub.track, category: sub.category })}
                            className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                              activeNode
                                ? "bg-gray-900 text-white font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <Bubble
                              complete={complete}
                              partial={passed > 0}
                              onDark={activeNode}
                            />
                            <span className="truncate">{sub.category}</span>
                            <span
                              className={`ml-auto text-[10px] tabular-nums ${
                                activeNode
                                  ? "text-gray-300"
                                  : complete
                                    ? "text-green-600"
                                    : "text-gray-400"
                              }`}
                            >
                              {passed}/{sub.lessons.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* ── Right: active subsection ── */}
        <div ref={contentRef} className="flex-1 min-w-0 scroll-mt-20">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <span>{activeSection.label}</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-500">{activeSub.category}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">{activeSub.category}</h2>
            {activeComplete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
                <span aria-hidden>✓</span> Complete
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-32 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{
                  width: `${activeLessons.length ? (activePassed / activeLessons.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {activePassed}/{activeLessons.length} modules passed
            </span>
          </div>

          {/* module list for this subsection */}
          <div className="mt-4 space-y-2">
            {activeLessons.map((l) => {
              const result = quizResults[l.id];
              const passed = isPassed(result);
              const percent = result ? Math.round((result.bestScore / result.total) * 100) : null;
              const locked = isLocked(l);
              return (
                <button
                  key={l.id}
                  onClick={() => openLesson(l.id)}
                  className="group flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-400 hover:shadow-sm transition-all"
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-5 text-gray-500 line-clamp-2">
                      {l.summary}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">{l.minutes} min read</p>
                  </div>
                  <span className="shrink-0 self-center">
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Trial
                      </span>
                    ) : loading ? null : result ? (
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
                </button>
              );
            })}
          </div>

          {/* advance to the next subsection / section */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            {activeComplete ? (
              nextRef && nextSection ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                      {nextIsNewSection ? "Next section" : "Up next"}
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nextIsNewSection ? `${nextSection.label} — ${nextRef.category}` : nextRef.category}
                    </p>
                  </div>
                  <button
                    onClick={() => goTo({ track: nextRef.track, category: nextRef.category })}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                  >
                    {nextIsNewSection ? "Start next section" : "Next subsection"}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-green-800">🎉 Curriculum complete</p>
                  <p className="text-xs text-green-700">
                    You&rsquo;ve passed every module across every section. Nicely done.
                  </p>
                </div>
              )
            ) : (
              <p className="text-xs text-gray-400">
                Pass the quiz on every module in this subsection to unlock the next section.
                {activePassed > 0 && ` (${activeLessons.length - activePassed} to go.)`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Progress bubble: filled green check when complete, a partial ring while in
 *  progress, and a hollow ring before any module in the subsection is passed. */
function Bubble({
  complete,
  partial,
  onDark,
}: {
  complete: boolean;
  partial: boolean;
  onDark: boolean;
}) {
  if (complete) {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-[9px] leading-none"
        aria-label="Complete"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
        partial ? "border-green-500" : onDark ? "border-gray-400" : "border-gray-300"
      }`}
      aria-label={partial ? "In progress" : "Not started"}
    >
      {partial && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
    </span>
  );
}
