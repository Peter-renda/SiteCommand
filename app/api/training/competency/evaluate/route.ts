/**
 * POST /api/training/competency/evaluate — body { projectId }.
 *
 * Manually runs the scenario engine (evaluation + due ripples) for one of the
 * caller's sandboxes at its current in-sim day, so the Skills page can offer
 * a "grade my sandbox now" action instead of waiting for the next day
 * advance. Owner-only, training-projects-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { runTrainingScenarioEngine } from "@/lib/training-scenario-eval";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projectId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const supabase = getSupabase();
  const { data: project } = await supabase
    .from("projects")
    .select("id, is_training, training_owner_id, training_day")
    .eq("id", projectId)
    .maybeSingle();

  if (!project?.is_training) {
    return NextResponse.json({ error: "Sandbox project not found" }, { status: 404 });
  }
  if (project.training_owner_id !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await runTrainingScenarioEngine(supabase, {
    projectId,
    day: project.training_day ?? 0,
  });

  return NextResponse.json({ ok: true });
}
