import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { calculateSubmittalSchedule } from "@/lib/submittalSchedule";
import { logSubmittalDiff } from "@/lib/submittal-history";

async function logBulkSubmittalDiffs(
  projectId: string,
  session: Awaited<ReturnType<typeof getSession>>,
  previousRows: Array<Record<string, unknown>>,
  updatedRows: Array<Record<string, unknown>>,
) {
  if (!session) return;
  const supabase = getSupabase();
  const previousById = new Map(
    previousRows
      .map((row) => (typeof row.id === "string" ? [row.id, row] as const : null))
      .filter((entry): entry is readonly [string, Record<string, unknown>] => entry !== null),
  );

  await Promise.all(
    updatedRows.map((row) => {
      const submittalId = typeof row.id === "string" ? row.id : null;
      if (!submittalId) return Promise.resolve();
      return logSubmittalDiff(
        supabase,
        session,
        submittalId,
        projectId,
        previousById.get(submittalId) ?? null,
        row,
      );
    })
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { action, submittal_ids: submittalIds, payload } = await req.json();

  if (!Array.isArray(submittalIds) || submittalIds.length === 0) {
    return NextResponse.json({ error: "submittal_ids is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (action === "mark_private" || action === "mark_public") {
    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update({ private: action === "mark_private" })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "delete") {
    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: session.id })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "retrieve") {
    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", true)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update({ is_deleted: false, deleted_at: null, deleted_by: null })
      .eq("project_id", projectId)
      .eq("is_deleted", true)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "change_status") {
    const nextStatus = payload?.status as string | undefined;
    if (!nextStatus) return NextResponse.json({ error: "payload.status is required" }, { status: 400 });
    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update({ status: nextStatus })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "redistribute") {
    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update({ distributed_at: new Date().toISOString(), distributed_by: session.id })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (action === "apply_workflow") {
    const workflowSteps = Array.isArray(payload?.workflow_steps) ? payload.workflow_steps : null;
    if (!workflowSteps) return NextResponse.json({ error: "payload.workflow_steps is required" }, { status: 400 });

    const { data: items, error: readError } = await supabase
      .from("submittals")
      .select("id, status, workflow_steps")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

    const eligible = (items ?? []).filter((s) => {
      const hasExistingWorkflow = Array.isArray(s.workflow_steps) && s.workflow_steps.length > 0;
      return s.status === "draft" && !hasExistingWorkflow;
    });
    const eligibleIds = eligible.map((s) => s.id);
    if (eligibleIds.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, skipped: submittalIds.length });
    }

    const firstPerson = (workflowSteps[0] as { person_id?: string | null } | undefined)?.person_id ?? null;
    const { data, error } = await supabase
      .from("submittals")
      .update({ workflow_steps: workflowSteps, ball_in_court_id: firstPerson })
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", eligibleIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, eligible as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0, skipped: submittalIds.length - (data?.length ?? 0) });
  }

  if (action === "edit") {
    const allowed = [
      "specification_id", "submittal_manager_id", "responsible_contractor_id", "received_from_id",
      "cost_code", "status", "private", "submittal_type", "submit_by", "final_due_date",
      "required_on_site_date", "lead_time", "design_team_review_time", "internal_review_time",
    ] as const;

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (payload && key in payload) update[key] = payload[key as keyof typeof payload] ?? null;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields were provided" }, { status: 400 });
    }

    const hasScheduleInput = ["required_on_site_date", "lead_time", "design_team_review_time", "internal_review_time"].some(
      (k) => k in update
    );
    if (hasScheduleInput) {
      Object.assign(
        update,
        calculateSubmittalSchedule({
          required_on_site_date: (update.required_on_site_date as string | null | undefined) ?? null,
          lead_time: (update.lead_time as number | null | undefined) ?? null,
          design_team_review_time: (update.design_team_review_time as number | null | undefined) ?? null,
          internal_review_time: (update.internal_review_time as number | null | undefined) ?? null,
        })
      );
    }

    const { data: previous } = await supabase
      .from("submittals")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds);
    const { data, error } = await supabase
      .from("submittals")
      .update(update)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .in("id", submittalIds)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logBulkSubmittalDiffs(projectId, session, (previous ?? []) as Record<string, unknown>[], (data ?? []) as Record<string, unknown>[]);
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
