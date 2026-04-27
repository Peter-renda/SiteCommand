import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logSubmittalDiff } from "@/lib/submittal-history";

type WorkflowStep = {
  step: number;
  person_id: string | null;
  role: string;
  due_date: string | null;
  sent_date?: string | null;
  returned_date?: string | null;
  response?: string | null;
  comments?: string | null;
  attachments?: { name: string; url: string }[];
  forwarded_by_person_id?: string | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const personId = (formData.get("person_id") as string | null) ?? null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!personId) return NextResponse.json({ error: "person_id is required" }, { status: 400 });

  const supabase = getSupabase();

  const { data: submittal } = await supabase
    .from("submittals")
    .select("workflow_steps")
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (!submittal) return NextResponse.json({ error: "Submittal not found" }, { status: 404 });

  const steps = Array.isArray(submittal.workflow_steps) ? (submittal.workflow_steps as WorkflowStep[]) : [];
  if (!steps.some((s) => s.person_id === personId)) {
    return NextResponse.json({ error: "Workflow step not found for person_id" }, { status: 404 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${projectId}/${submittalId}/responses/${personId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("submittal-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("submittal-attachments").getPublicUrl(path);
  const attachment = { name: file.name, url: urlData.publicUrl };

  const nextSteps = steps.map((step) =>
    step.person_id === personId
      ? { ...step, attachments: [...(step.attachments ?? []), attachment] }
      : step
  );

  const { data: updated, error: updateError } = await supabase
    .from("submittals")
    .update({ workflow_steps: nextSteps })
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logSubmittalDiff(
    supabase,
    session,
    submittalId,
    projectId,
    submittal as Record<string, unknown>,
    updated as Record<string, unknown>,
  );
  return NextResponse.json(updated);
}
