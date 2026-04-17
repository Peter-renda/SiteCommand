import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const { action, payload } = await req.json();
  const supabase = getSupabase();

  if (action === "add_existing") {
    const submittalIds = Array.isArray(payload?.submittal_ids) ? payload.submittal_ids as string[] : [];
    if (submittalIds.length === 0) return NextResponse.json({ error: "payload.submittal_ids is required" }, { status: 400 });

    const { data: currentLinks, error: linksError } = await supabase
      .from("submittal_package_items")
      .select("submittal_id")
      .in("submittal_id", submittalIds);
    if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

    const alreadyPackaged = new Set((currentLinks ?? []).map((r) => r.submittal_id));
    const insertable = submittalIds.filter((id) => !alreadyPackaged.has(id));
    if (insertable.length === 0) return NextResponse.json({ ok: true, added: 0, skipped: submittalIds.length });

    const { error } = await supabase.from("submittal_package_items").insert(
      insertable.map((id) => ({ package_id: packageId, submittal_id: id }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, added: insertable.length, skipped: submittalIds.length - insertable.length });
  }

  if (action === "remove_items") {
    const submittalIds = Array.isArray(payload?.submittal_ids) ? payload.submittal_ids as string[] : [];
    if (submittalIds.length === 0) return NextResponse.json({ error: "payload.submittal_ids is required" }, { status: 400 });

    const { error } = await supabase
      .from("submittal_package_items")
      .delete()
      .eq("package_id", packageId)
      .in("submittal_id", submittalIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, removed: submittalIds.length });
  }

  if (action === "bulk_edit") {
    const submittalIds = Array.isArray(payload?.submittal_ids) ? payload.submittal_ids as string[] : [];
    const fields = payload?.fields as Record<string, unknown> | undefined;
    if (submittalIds.length === 0) return NextResponse.json({ error: "payload.submittal_ids is required" }, { status: 400 });
    if (!fields || Object.keys(fields).length === 0) return NextResponse.json({ error: "payload.fields is required" }, { status: 400 });

    const allowed = ["status", "specification_id", "submittal_manager_id", "responsible_contractor_id", "received_from_id", "private", "submittal_type"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in fields) update[key] = fields[key] ?? null;
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "No supported fields were provided" }, { status: 400 });

    const { data, error } = await supabase
      .from("submittals")
      .update(update)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "mass_review") {
    const reviews = Array.isArray(payload?.reviews) ? payload.reviews as Array<{ submittal_id: string; person_id: string; response?: string | null; comments?: string | null }> : [];
    if (reviews.length === 0) return NextResponse.json({ error: "payload.reviews is required" }, { status: 400 });

    let updated = 0;
    for (const review of reviews) {
      const { data: current, error: readError } = await supabase
        .from("submittals")
        .select("id, workflow_steps, ball_in_court_id, status")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .eq("id", review.submittal_id)
        .single();
      if (readError || !current || current.ball_in_court_id !== review.person_id) continue;

      const steps = Array.isArray(current.workflow_steps) ? current.workflow_steps as Array<Record<string, unknown>> : [];
      const nextSteps = steps.map((step) => {
        if (step.person_id !== review.person_id) return step;
        return {
          ...step,
          returned_date: new Date().toISOString().slice(0, 10),
          response: review.response ?? step.response ?? null,
          comments: review.comments ?? step.comments ?? null,
        };
      });

      const currentIdx = nextSteps.findIndex((s) => s.person_id === review.person_id);
      const next = currentIdx >= 0 ? nextSteps.slice(currentIdx + 1).find((s) => s.person_id && !s.returned_date) : null;
      const nextBallInCourt = (next?.person_id as string | null | undefined) ?? null;

      const { error: updateError } = await supabase
        .from("submittals")
        .update({ workflow_steps: nextSteps, ball_in_court_id: nextBallInCourt, status: current.status === "draft" ? "open" : current.status })
        .eq("project_id", projectId)
        .eq("id", review.submittal_id)
        .eq("is_deleted", false);
      if (!updateError) updated += 1;
    }

    return NextResponse.json({ ok: true, updated, skipped: reviews.length - updated });
  }

  if (action === "distribute") {
    const submittalIds = Array.isArray(payload?.submittal_ids) ? payload.submittal_ids as string[] : [];
    if (submittalIds.length === 0) return NextResponse.json({ error: "payload.submittal_ids is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("submittals")
      .update({ distributed_at: new Date().toISOString(), distributed_by: session.id })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
