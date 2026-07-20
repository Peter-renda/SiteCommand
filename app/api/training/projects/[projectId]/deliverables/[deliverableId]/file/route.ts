/**
 * GET /api/training/projects/[projectId]/deliverables/[deliverableId]/file
 *
 * Open the submitted workbook for a deliverable — the stable link embedded in
 * the simulated follow-up email (signed URLs expire; this route mints a fresh
 * one and redirects, same pattern as the phase-review PDF route). Owner-only
 * and training-flagged-projects-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const STORAGE_BUCKET = "project-drawings";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; deliverableId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, deliverableId } = await params;
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

  const { data: submission } = await supabase
    .from("training_deliverable_submissions")
    .select("file_storage_path")
    .eq("project_id", projectId)
    .eq("deliverable_id", deliverableId)
    .maybeSingle();

  if (!submission?.file_storage_path) {
    return NextResponse.json({ error: "No submitted file for this deliverable" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(submission.file_storage_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not open the submitted file." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
