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
