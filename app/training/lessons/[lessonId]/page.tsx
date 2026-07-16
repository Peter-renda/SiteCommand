import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLesson } from "@/lib/training-lessons";
import { getPublicQuiz } from "@/lib/training-lesson-quizzes";
import LessonDetailClient from "./LessonDetailClient";

/**
 * Training → Modules: a single module (lesson) as its own page, so the
 * Training Modules list can hyperlink each lesson open in a new tab. Renders
 * the lesson text and, at the end, the graded quiz. The quiz's correct answers
 * never reach the client — only the answer-stripped PublicQuiz is passed down,
 * and grading happens server-side via /api/training/lessons/quiz.
 */

// Modules open in their own browser tabs, so per-lesson tab titles are how
// users tell several open modules apart.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  return { title: lesson ? `${lesson.title} – Training Modules` : "Training Modules" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) redirect("/training/lessons");

  const quiz = getPublicQuiz(lessonId) ?? null;

  return <LessonDetailClient lesson={lesson} quiz={quiz} />;
}
