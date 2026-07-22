/**
 * Training → Modules: fetch a lesson's answer-stripped quiz for inline reading.
 *
 * The Training Modules list renders a module (and its quiz) inline on the same
 * page instead of opening a standalone tab. The quiz's correct answers live in
 * lib/training-lesson-quizzes.ts and must NEVER reach the client, so the list
 * page fetches the PublicQuiz (prompts + options only) from here. Grading still
 * happens server-side via POST /api/training/lessons/quiz.
 *
 * GET ?lessonId=<id> — { quiz: PublicQuiz | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPublicQuiz } from "@/lib/training-lesson-quizzes";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId")?.trim() ?? "";
  if (!lessonId) return NextResponse.json({ error: "lessonId is required" }, { status: 400 });

  const quiz = getPublicQuiz(lessonId) ?? null;
  return NextResponse.json({ quiz });
}
