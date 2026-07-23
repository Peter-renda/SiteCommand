import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { isCompanyAdmin } from "@/lib/project-access";
import { LESSONS } from "@/lib/training-lessons";
import HomeClient from "./HomeClient";

export const metadata = { title: "Progress Overview – CPMA" };

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

  // Training-module completion (per-user; lessons are static content).
  const { count: completedLessons } = await supabase
    .from("training_lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
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
      completedLessons={completedLessons ?? 0}
      projects={ongoing ?? []}
    />
  );
}
