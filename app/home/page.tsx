import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { isCompanyAdmin } from "@/lib/project-access";
import { LESSONS, TRACK_LABELS, type LessonTrack } from "@/lib/training-lessons";
import HomeClient from "./HomeClient";

export const metadata = { title: "Progress Overview – CPMA" };

/** How many lesson-progress rows were completed within the last 7 days. */
function countCompletedThisWeek(rows: { completed_at: string | null }[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return rows.reduce(
    (n, r) => n + (r.completed_at && Date.parse(r.completed_at) >= weekAgo ? 1 : 0),
    0,
  );
}

/**
 * Post-login landing page: a personal progress overview.
 *
 * The SiteCommand projects dashboard still lives at /dashboard (reachable from
 * the "Open Projects" menu item); this page greets the trainee with where they
 * stand — training-module completion, how many mock projects are in flight, and
 * their own job-search goal + countdown.
 */
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // External users (subcontractors) have their own dedicated portal.
  if (session.user_type === "external") redirect("/subcontractor");

  const supabase = getSupabase();
  const totalLessons = LESSONS.length;

  // Demo users bypass the subscription check but still get a real overview.
  if (session.user_type !== "demo") {
    if (!session.company_id) redirect("/pricing");

    const { data: company } = await supabase
      .from("companies")
      .select("subscription_status, stripe_subscription_id")
      .eq("id", session.company_id)
      .single();

    const ACTIVE_STATUSES = ["active", "trialing"];
    if (isCompanyAdmin(session.company_role)) {
      if (
        !company ||
        (company.stripe_subscription_id &&
          company.subscription_status !== null &&
          !ACTIVE_STATUSES.includes(company.subscription_status))
      ) {
        redirect("/pricing");
      }
    }
  }

  // Training-module completion (per-user; lessons are static content). We pull
  // the completed lesson ids (not just a count) so we can break progress down
  // by curriculum track and measure this week's momentum.
  const { data: progressRows } = await supabase
    .from("training_lesson_progress")
    .select("lesson_id, completed_at")
    .eq("user_id", session.id);

  const completed = progressRows ?? [];
  const completedLessons = completed.length;
  const completedIds = new Set(completed.map((r) => r.lesson_id));
  const completedThisWeek = countCompletedThisWeek(completed);

  // Per-track progress across the nine lifecycle / cross-cutting tracks.
  const tracks = (Object.keys(TRACK_LABELS) as LessonTrack[])
    .map((key) => {
      const inTrack = LESSONS.filter((l) => l.track === key);
      const done = inTrack.reduce((n, l) => n + (completedIds.has(l.id) ? 1 : 0), 0);
      return { key, label: TRACK_LABELS[key], done, total: inTrack.length };
    })
    .filter((t) => t.total > 0);

  // Verifiable credential + quiz activity — the "prove it" milestone that turns
  // training into something a trainee can put in front of an employer.
  const { data: credential } = await supabase
    .from("training_credentials")
    .select("code, overall_level, overall_score")
    .eq("user_id", session.id)
    .maybeSingle();

  const { count: quizzesTaken } = await supabase
    .from("training_lesson_quiz_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.id);

  // Ongoing mock projects: the user's active, non-archived training sandboxes.
  const { data: ongoing } = await supabase
    .from("projects")
    .select("id, name, training_role, training_project_type, training_day, training_last_saved_at")
    .eq("is_training", true)
    .eq("training_owner_id", session.id)
    .eq("status", "active")
    .is("archived_at", null)
    .order("training_last_saved_at", { ascending: false });

  return (
    <HomeClient
      username={session.username}
      email={session.email}
      totalLessons={totalLessons}
      completedLessons={completedLessons}
      completedThisWeek={completedThisWeek}
      tracks={tracks}
      quizzesTaken={quizzesTaken ?? 0}
      credential={credential ?? null}
      projects={ongoing ?? []}
    />
  );
}
