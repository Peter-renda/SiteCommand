/**
 * Coach narration for a "SiteCommand Training" sandbox.
 *
 * POST /api/projects/[id]/training/narration — body { day } → returns the coach's
 * text message for that in-sim day ({ title, text }), personalized with the
 * trainee's first name and the project name.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canAccessProject } from "@/lib/project-access";
import { buildTrainingNarration } from "@/lib/training-narration";
import { getTrainingSchedule, resolveDayIndex } from "@/lib/training-schedule";
import type { SimRole } from "@/lib/simulation-constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(projectId, session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { day?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const rawDay = Number(body.day);

  const supabase = getSupabase();
  const { data: project } = await supabase
    .from("projects")
    .select("is_training, training_role, training_project_type, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || !project.is_training) {
    return NextResponse.json({ error: "Not a training project" }, { status: 404 });
  }
  const role = (project.training_role ?? "") as SimRole;

  // Resolve the requested (possibly raw) day to the active scheduled day.
  const schedule = getTrainingSchedule(role);
  if (schedule.length === 0) {
    return NextResponse.json({ error: "No narration for this role" }, { status: 404 });
  }
  const idx = resolveDayIndex(schedule, Number.isFinite(rawDay) ? rawDay : 0);
  const scheduledDay = schedule[Math.max(0, idx)].day;

  // Resolve the trainee's first name for a personal greeting.
  const { data: user } = await supabase
    .from("users")
    .select("first_name, last_name, username")
    .eq("id", session.id)
    .maybeSingle();
  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "";

  const narration = buildTrainingNarration(role, scheduledDay, {
    userName,
    projectName: project.name,
    projectType: project.training_project_type,
  });
  if (!narration) {
    return NextResponse.json({ error: "No narration for this role" }, { status: 404 });
  }

  return NextResponse.json({ title: narration.title, text: narration.text, day: scheduledDay });
}
