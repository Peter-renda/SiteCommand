import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessProject } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";
import AssistWidget from "@/components/AssistWidget";
import TrainingBanner from "./components/TrainingBanner";
import TrainingDayPanel from "./components/TrainingDayPanel";
import type { SimRole } from "@/lib/simulation-constants";

function isTrainingRole(role: string | null): role is SimRole {
  return role === "superintendent" || role === "project_manager" || role === "accounting";
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  // Demo users may navigate into projects they created client-side (sessionStorage only).
  // Those projects don't exist in the database, so we skip the DB access check for demo
  // accounts and trust the client-side interceptor to handle data correctly.
  let isTraining = false;
  let trainingRole: string | null = null;
  let trainingDay = 0;
  if (session.user_type !== "demo") {
    const hasAccess = await canAccessProject(id, session);
    if (!hasAccess) redirect("/dashboard");

    // Sandbox projects mount the headless TrainingBanner (silent auto-save)
    // and the left-edge Day panel; the visible "SiteCommand Training" banner
    // was removed.
    const { data: project } = await getSupabase()
      .from("projects")
      .select("is_training, training_role, training_day")
      .eq("id", id)
      .maybeSingle();
    isTraining = !!project?.is_training;
    trainingRole = project?.training_role ?? null;
    trainingDay = project?.training_day ?? 0;
  }

  return (
    <>
      {/* Headless: drives the sandbox auto-save; the visible banner was removed. */}
      {isTraining && <TrainingBanner projectId={id} />}
      {children}
      <AssistWidget projectId={id} />
      {isTraining && isTrainingRole(trainingRole) && (
        // The coach's daily message is embedded inside the Day panel (left edge).
        <TrainingDayPanel projectId={id} role={trainingRole} initialDay={trainingDay} />
      )}
    </>
  );
}
