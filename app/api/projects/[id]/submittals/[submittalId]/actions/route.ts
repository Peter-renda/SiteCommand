import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendSubmittalCreatedEmail } from "@/lib/email";
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

function nextRevisionValue(current: string | null): string {
  const value = (current ?? "0").trim();
  if (/^\d+$/.test(value)) return String(Number(value) + 1);
  if (/^[A-Z]$/.test(value)) return String.fromCharCode(value.charCodeAt(0) + 1);
  if (/^[A-Z]\d+$/.test(value)) {
    const prefix = value[0];
    const num = Number(value.slice(1));
    return `${prefix}${num + 1}`;
  }
  return `${value}-rev`;
}

async function getNextSubmittalNumber(projectId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("submittals")
    .select("submittal_number")
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .order("submittal_number", { ascending: false })
    .limit(1)
    .single();
  return (data?.submittal_number ?? 0) + 1;
}

function nextBallInCourtAfterResponse(steps: WorkflowStep[], actorPersonId: string): string | null {
  const current = steps.find((step) => step.person_id === actorPersonId);
  if (!current) return null;

  if (current.forwarded_by_person_id) return current.forwarded_by_person_id;

  const ordered = [...steps].sort((a, b) => a.step - b.step);
  const currentIdx = ordered.findIndex((s) => s.person_id === actorPersonId);
  if (currentIdx === -1) return null;

  const next = ordered.slice(currentIdx + 1).find((s) => s.person_id && !s.returned_date);
  return next?.person_id ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const { action, payload } = await req.json();
  const supabase = getSupabase();

  const { data: existing, error: getError } = await supabase
    .from("submittals")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", submittalId)
    .eq("is_deleted", false)
    .single();

  if (getError || !existing) {
    return NextResponse.json({ error: "Submittal not found" }, { status: 404 });
  }

  const logUpdateHistory = async (updated: Record<string, unknown>) => {
    await logSubmittalDiff(
      supabase,
      session,
      submittalId,
      projectId,
      existing as Record<string, unknown>,
      updated,
    );
  };

  const logCreatedHistory = async (created: Record<string, unknown>) => {
    const createdId = typeof created.id === "string" ? created.id : submittalId;
    await logSubmittalDiff(
      supabase,
      session,
      createdId,
      projectId,
      null,
      created,
    );
  };

  if (action === "change_ball_in_court") {
    if (!("draft" === existing.status || "open" === existing.status)) {
      return NextResponse.json({ error: "Ball in Court can only be changed on Draft/Open submittals" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("submittals")
      .update({ ball_in_court_id: payload?.ball_in_court_id ?? null })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "mark_private" || action === "mark_public") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ private: action === "mark_private" })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "remove_workflow_person") {
    const personId = payload?.person_id as string | undefined;
    if (!personId) {
      return NextResponse.json({ error: "person_id is required" }, { status: 400 });
    }
    const currentSteps = Array.isArray(existing.workflow_steps) ? (existing.workflow_steps as WorkflowStep[]) : [];
    const nextSteps = currentSteps
      .filter((s) => s.person_id !== personId)
      .map((s, idx) => ({ ...s, step: idx + 1 }));
    const nextBallInCourt = existing.ball_in_court_id === personId ? null : existing.ball_in_court_id;
    const { data, error } = await supabase
      .from("submittals")
      .update({ workflow_steps: nextSteps, ball_in_court_id: nextBallInCourt })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "edit_response") {
    const personId = payload?.person_id as string | undefined;
    if (!personId) return NextResponse.json({ error: "person_id is required" }, { status: 400 });
    if (payload?.forward_for_review_to) {
      return NextResponse.json(
        { error: "Forward for Review is not available when editing a response on behalf of another user" },
        { status: 400 }
      );
    }
    if (existing.ball_in_court_id !== personId) {
      return NextResponse.json({ error: "Only the current Ball In Court workflow user can be edited" }, { status: 400 });
    }

    const currentSteps = Array.isArray(existing.workflow_steps) ? (existing.workflow_steps as WorkflowStep[]) : [];
    const nextSteps = currentSteps.map((step) =>
      step.person_id === personId
        ? {
            ...step,
            sent_date: (payload?.sent_date as string | undefined) ?? step.sent_date ?? null,
            returned_date: (payload?.returned_date as string | undefined) ?? step.returned_date ?? new Date().toISOString().slice(0, 10),
            response: (payload?.response as string | undefined) ?? step.response ?? null,
            comments: (payload?.comments as string | undefined) ?? step.comments ?? null,
            attachments: Array.isArray(payload?.attachments)
              ? (payload?.attachments as { name: string; url: string }[])
              : step.attachments ?? [],
          }
        : step
    );

    const nextBallInCourt = nextBallInCourtAfterResponse(nextSteps, personId);
    const { data, error } = await supabase
      .from("submittals")
      .update({
        workflow_steps: nextSteps,
        ball_in_court_id: nextBallInCourt,
        status: existing.status === "draft" ? "open" : existing.status,
      })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "forward_for_review") {
    const toPersonId = payload?.to_person_id as string | undefined;
    const actorContactId = payload?.actor_contact_id as string | undefined;
    if (!toPersonId) return NextResponse.json({ error: "to_person_id is required" }, { status: 400 });
    if (actorContactId && existing.ball_in_court_id !== actorContactId) {
      return NextResponse.json({ error: "Only the Ball In Court reviewer can forward for review" }, { status: 400 });
    }

    const currentSteps = Array.isArray(existing.workflow_steps) ? (existing.workflow_steps as WorkflowStep[]) : [];
    const maxStep = currentSteps.reduce((max, step) => Math.max(max, step.step || 0), 0);
    const inserted: WorkflowStep = {
      step: maxStep + 1,
      person_id: toPersonId,
      role: "Reviewer",
      due_date: (payload?.due_date as string | undefined) ?? null,
      sent_date: (payload?.sent_date as string | undefined) ?? new Date().toISOString().slice(0, 10),
      comments: (payload?.comments as string | undefined) ?? null,
      attachments: Array.isArray(payload?.attachments)
        ? (payload?.attachments as { name: string; url: string }[])
        : [],
      forwarded_by_person_id: existing.ball_in_court_id,
    };

    const { data, error } = await supabase
      .from("submittals")
      .update({
        workflow_steps: [...currentSteps, inserted],
        ball_in_court_id: toPersonId,
        status: existing.status === "draft" ? "open" : existing.status,
      })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "redistribute") {
    const { data, error } = await supabase
      .from("submittals")
      .update({
        distributed_at: new Date().toISOString(),
        distributed_by: session.id,
      })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);

    const workflowSteps = Array.isArray(existing.workflow_steps) ? (existing.workflow_steps as WorkflowStep[]) : [];
    const workflowIds = workflowSteps.map((step) => step.person_id).filter(Boolean) as string[];

    const contactIds = Array.from(new Set(workflowIds));
    const contactMap = new Map<string, { name: string; email: string | null }>();
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from("directory_contacts")
        .select("id, first_name, last_name, email")
        .in("id", contactIds);
      for (const c of contacts ?? []) {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "there";
        contactMap.set(c.id, { name, email: c.email });
      }
    }

    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();
    const projectName = project?.name ?? "Unknown Project";
    const submittalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/projects/${projectId}/submittals/${submittalId}`;

    const recipients: { name: string; email: string }[] = [];
    const seenEmails = new Set<string>();
    const addRecipient = (name: string, email: string | null) => {
      if (!email) return;
      const key = email.toLowerCase();
      if (seenEmails.has(key)) return;
      seenEmails.add(key);
      recipients.push({ name, email });
    };

    const distributionList = Array.isArray(existing.distribution_list)
      ? (existing.distribution_list as { id: string; name: string; email: string | null }[])
      : [];
    for (const entry of distributionList) addRecipient(entry.name, entry.email);
    for (const personId of contactIds) {
      const c = contactMap.get(personId);
      if (c) addRecipient(c.name, c.email);
    }

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendSubmittalCreatedEmail(
          recipient.email,
          recipient.name,
          existing.submittal_number,
          existing.title,
          projectName,
          submittalUrl
        )
      )
    );

    return NextResponse.json({ ...data, recipient_count: recipients.length });
  }

  if (action === "close") {
    const { data, error } = await supabase
      .from("submittals")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: session.id })
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logUpdateHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  if (action === "distribute") {
    const closePayload = {
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: session.id,
      distributed_at: new Date().toISOString(),
      distributed_by: session.id,
    };
    const { data: closed, error } = await supabase
      .from("submittals")
      .update(closePayload)
      .eq("id", submittalId)
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .select()
      .single();
    if (error || !closed) return NextResponse.json({ error: error?.message ?? "Failed to distribute" }, { status: 500 });
    await logUpdateHistory(closed as Record<string, unknown>);

    if (payload?.create_revision_upon_distribution) {
      const nextNumber = await getNextSubmittalNumber(projectId);
      const nextRevision = nextRevisionValue(closed.revision);
      const { data: revision, error: revError } = await supabase
        .from("submittals")
        .insert({
          ...closed,
          id: undefined,
          submittal_number: nextNumber,
          revision: nextRevision,
          status: "draft",
          closed_at: null,
          closed_by: null,
          distributed_at: null,
          distributed_by: null,
          duplicate_of_id: closed.id,
          created_by: session.id,
          created_at: undefined,
        })
        .select()
        .single();
      if (revError) return NextResponse.json({ error: revError.message }, { status: 500 });
      await logCreatedHistory(revision as Record<string, unknown>);
      return NextResponse.json({ distributed: closed, revision });
    }

    return NextResponse.json({ distributed: closed });
  }

  if (action === "duplicate" || action === "create_revision") {
    const nextNumber = await getNextSubmittalNumber(projectId);
    const revision = action === "create_revision" ? nextRevisionValue(existing.revision) : existing.revision;

    const { data, error } = await supabase
      .from("submittals")
      .insert({
        ...existing,
        id: undefined,
        submittal_number: nextNumber,
        revision,
        status: "draft",
        closed_at: null,
        closed_by: null,
        distributed_at: null,
        distributed_by: null,
        duplicate_of_id: existing.id,
        created_by: session.id,
        created_at: undefined,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logCreatedHistory(data as Record<string, unknown>);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
