import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLesson } from "@/lib/training-lessons";
import LessonsClient from "./LessonsClient";

export const metadata = { title: "Training Modules – CPMA" };

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Legacy deep link: /training/lessons?lesson=<id> predates the standalone
  // module pages. Forward old bookmarks/history to the module's own page.
  const { lesson: legacyId } = await searchParams;
  if (legacyId && getLesson(legacyId)) redirect(`/training/lessons/${legacyId}`);

  return <LessonsClient />;
}
