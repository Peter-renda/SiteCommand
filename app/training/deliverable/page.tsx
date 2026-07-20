import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getTrainingDeliverable } from "@/lib/training-deliverables";
import TrainingDeliverableClient from "./TrainingDeliverableClient";

/**
 * Deliverable workspace for a SiteCommand Training sandbox. Opened in a new
 * tab from the Day panel's hyperlinked deliverable task: download the Excel
 * template, fill it out, submit the completed workbook (which also sends the
 * simulated follow-up email where the deliverable defines one), and get the
 * AI grade + feedback. See lib/training-deliverables.ts for the definitions
 * and /api/training/projects/[projectId]/deliverables for the backend.
 */
export default async function TrainingDeliverablePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; d?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { project: projectId, d: deliverableId } = await searchParams;
  if (!projectId || !deliverableId) redirect("/training/practice");

  const deliverable = getTrainingDeliverable(deliverableId);
  if (!deliverable) redirect("/training/practice");

  const { data: project } = await getSupabase()
    .from("projects")
    .select("id, is_training, training_owner_id, training_role, training_project_type, name")
    .eq("id", projectId)
    .maybeSingle();

  // Owner-only, training-flagged sandboxes only, matching the deliverable's role.
  if (!project || !project.is_training || project.training_owner_id !== session.id) {
    redirect("/training/practice");
  }
  if (project.training_role !== deliverable.role) redirect(`/projects/${projectId}`);

  return (
    <TrainingDeliverableClient
      projectId={project.id}
      deliverableId={deliverable.id}
      projectName={project.name ?? "Training Project"}
      projectType={project.training_project_type ?? null}
    />
  );
}
