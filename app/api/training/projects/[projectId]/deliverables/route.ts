/**
 * GET /api/training/projects/[projectId]/deliverables
 *
 * List the sandbox's deliverable submissions (grades included) so the Day
 * panel can badge tasks and the deliverable workspace can restore state.
 * Owner-only and training-flagged-projects-only, matching the rest of
 * /api/training/projects/[projectId].
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const supabase = getSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, is_training, training_owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || !project.is_training) {
    return NextResponse.json({ error: "Sandbox project not found" }, { status: 404 });
  }
  if (project.training_owner_id !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabase
    .from("training_deliverable_submissions")
    .select("deliverable_id, day, file_name, score, letter, attempts, graded_at, updated_at")
    .eq("project_id", projectId);

  return NextResponse.json({
    submissions: (rows ?? []).map((r) => ({
      deliverableId: r.deliverable_id,
      day: r.day,
      fileName: r.file_name,
      score: r.score,
      letter: r.letter,
      attempts: r.attempts,
      gradedAt: r.graded_at,
      updatedAt: r.updated_at,
    })),
  });
}
