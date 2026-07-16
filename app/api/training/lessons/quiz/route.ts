/**
 * Training → Modules: end-of-lesson quiz grading + per-user results.
 *
 * Quiz questions/answers are static (lib/training-lesson-quizzes.ts) and never
 * leave the server — grading happens here and only the score comes back. This
 * route persists the score to training_lesson_quiz_results so the Training
 * Modules page can show a grade per module.
 *
 * GET  — { results: { [lessonId]: { score, total, bestScore, attempts, completedAt } } }
 *        for the current user.
 * POST — body { lessonId, answers: number[] }. Grades the attempt, upserts the
 *        result (tracking best score + attempt count), and returns the grade
 *        plus which options were correct.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { gradeQuiz, getLessonQuiz } from "@/lib/training-lesson-quizzes";

type ResultRow = {
  lesson_id: string;
  score: number;
  total: number;
  best_score: number;
  attempts: number;
  completed_at: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("training_lesson_quiz_results")
    .select("lesson_id, score, total, best_score, attempts, completed_at")
    .eq("user_id", session.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<
    string,
    { score: number; total: number; bestScore: number; attempts: number; completedAt: string }
  > = {};
  for (const r of (data ?? []) as ResultRow[]) {
    results[r.lesson_id] = {
      score: r.score,
      total: r.total,
      bestScore: r.best_score,
      attempts: r.attempts,
      completedAt: r.completed_at,
    };
  }

  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { lessonId?: unknown; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!lessonId) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });

  const quiz = getLessonQuiz(lessonId);
  if (!quiz) return NextResponse.json({ error: "No quiz for this lesson" }, { status: 404 });

  // Normalize answers into a fixed-length numeric array; unanswered → -1.
  const raw = Array.isArray(body.answers) ? body.answers : [];
  const answers = quiz.questions.map((_, i) => {
    const v = raw[i];
    return typeof v === "number" && Number.isInteger(v) ? v : -1;
  });

  const grade = gradeQuiz(lessonId, answers);
  if (!grade) return NextResponse.json({ error: "No quiz for this lesson" }, { status: 404 });

  const supabase = getSupabase();

  // Read the prior result (if any) to carry forward best score + attempt count.
  const { data: existing, error: readError } = await supabase
    .from("training_lesson_quiz_results")
    .select("best_score, attempts")
    .eq("user_id", session.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const priorBest = existing?.best_score ?? 0;
  const priorAttempts = existing?.attempts ?? 0;
  const bestScore = Math.max(priorBest, grade.score);
  const attempts = priorAttempts + 1;

  const { error: writeError } = await supabase.from("training_lesson_quiz_results").upsert(
    {
      user_id: session.id,
      lesson_id: lessonId,
      score: grade.score,
      total: grade.total,
      best_score: bestScore,
      attempts,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 });

  return NextResponse.json({
    score: grade.score,
    total: grade.total,
    correct: grade.correct,
    correctAnswers: grade.correctAnswers,
    bestScore,
    attempts,
  });
}
