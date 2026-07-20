/**
 * Training deliverable submission endpoint.
 *
 * GET  — the saved submission (grade + feedback) for one deliverable, or null.
 * POST — submit the completed workbook (multipart: file + optional note).
 *        The workbook is stored, its text extracted, the deliverable's
 *        follow-up email (with the file linked) is written into the sandbox
 *        inbox to the defined personas, the submission is AI-graded against
 *        the deliverable's criteria, and the lead recipient's grade-aware
 *        acknowledgment lands as a reply. Resubmitting regrades in place and
 *        bumps attempts.
 *
 * Owner-only and training-flagged-projects-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  getTrainingDeliverable,
  resolveDeliverableRecipients,
  deliverableConversationId,
} from "@/lib/training-deliverables";
import {
  extractWorkbookText,
  gradeDeliverableSubmission,
  buildDeliverableEmailHtml,
  buildRecipientAckHtml,
} from "@/lib/training-deliverable-grading";
import { inboxSendersForType, inboxSenderEmail } from "@/lib/training-inbox";
import { DEFAULT_COMPANY, emailDomain } from "@/lib/training-seed";
import { projectTypeLabel } from "@/lib/simulation-constants";

export const dynamic = "force-dynamic";
// Grading calls Gemini.
export const maxDuration = 60;

const STORAGE_BUCKET = "project-drawings";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

type ProjectRow = {
  id: string;
  is_training: boolean;
  training_owner_id: string | null;
  training_role: string | null;
  training_project_type: string | null;
  company_id: string | null;
  name: string | null;
};

async function loadGate(
  projectId: string,
  deliverableId: string,
  sessionId: string,
): Promise<
  | { error: NextResponse }
  | { project: ProjectRow; deliverable: NonNullable<ReturnType<typeof getTrainingDeliverable>> }
> {
  const supabase = getSupabase();
  const deliverable = getTrainingDeliverable(deliverableId);
  if (!deliverable) {
    return { error: NextResponse.json({ error: "Unknown deliverable" }, { status: 404 }) };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, is_training, training_owner_id, training_role, training_project_type, company_id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || !project.is_training) {
    return { error: NextResponse.json({ error: "Sandbox project not found" }, { status: 404 }) };
  }
  if (project.training_owner_id !== sessionId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (project.training_role !== deliverable.role) {
    return { error: NextResponse.json({ error: "Deliverable is for a different role" }, { status: 400 }) };
  }
  return { project: project as ProjectRow, deliverable };
}

function toClient(row: Record<string, unknown>) {
  return {
    deliverableId: row.deliverable_id,
    day: row.day,
    fileName: row.file_name,
    note: row.note,
    sentTo: row.sent_to ?? [],
    score: row.score,
    letter: row.letter,
    feedback: row.feedback ?? {},
    attempts: row.attempts,
    gradedAt: row.graded_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; deliverableId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, deliverableId } = await params;
  const gate = await loadGate(projectId, deliverableId, session.id);
  if ("error" in gate) return gate.error;

  const { data: row } = await getSupabase()
    .from("training_deliverable_submissions")
    .select("*")
    .eq("project_id", projectId)
    .eq("deliverable_id", deliverableId)
    .maybeSingle();

  return NextResponse.json({ submission: row ? toClient(row) : null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; deliverableId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, deliverableId } = await params;
  const gate = await loadGate(projectId, deliverableId, session.id);
  if ("error" in gate) return gate.error;
  const { project, deliverable } = gate;
  const supabase = getSupabase();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload" }, { status: 400 });
  }
  const file = form.get("file");
  const note = String(form.get("note") ?? "").slice(0, 2000);
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach your completed workbook to submit" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large (10 MB max)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name || "deliverable.xlsx";

  // 1) Extract the workbook's content (throws a user-facing message on bad files).
  let extracted: { text: string; dataRowCount: number };
  try {
    extracted = extractWorkbookText(buffer, fileName, deliverable);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "That file couldn't be read." },
      { status: 400 },
    );
  }

  // 2) Store the original file.
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const storagePath = `${projectId}/_deliverables/${deliverableId}-${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: `Couldn't store the file: ${uploadError.message}` },
      { status: 500 },
    );
  }

  // 3) Resolve the trainee + company context (same pattern as the scenario engine).
  const { data: owner } = await supabase
    .from("users")
    .select("first_name, last_name, username, email")
    .eq("id", project.training_owner_id!)
    .maybeSingle();
  const pmName =
    [owner?.first_name, owner?.last_name].filter(Boolean).join(" ").trim() ||
    owner?.username ||
    "Project Manager";
  const pmEmail = (owner?.email || "").toLowerCase();
  const pmFirst = (owner?.first_name || pmName).split(/\s+/)[0] || "there";

  let companyName = DEFAULT_COMPANY;
  if (project.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", project.company_id)
      .maybeSingle();
    if (company?.name) companyName = company.name;
  }
  const domain = emailDomain(companyName);
  const projectLabel =
    projectTypeLabel(project.training_project_type ?? "") || project.name || "training";

  // 4) Grade the submission.
  const grade = await gradeDeliverableSubmission({
    deliverable,
    extractedText: extracted.text,
    dataRowCount: extracted.dataRowCount,
    projectLabel,
    projectType: project.training_project_type,
    traineeName: pmName,
  });

  // 5) Send the simulated follow-up email (thread + outbound + ack reply).
  const recipients = resolveDeliverableRecipients(deliverable, project.training_project_type);
  const sentTo = recipients.map((r) => ({ key: r.key, name: r.name, company: r.company }));
  if (deliverable.followUp && recipients.length > 0) {
    try {
      const senders = inboxSendersForType(project.training_project_type);
      const fileUrl = `${appBaseUrl()}/api/training/projects/${projectId}/deliverables/${deliverableId}/file`;
      const outboundHtml = buildDeliverableEmailHtml({
        deliverable,
        recipients,
        pmFirst,
        projectLabel,
        note,
        fileName,
        fileUrl,
      });
      const outboundText = stripHtml(outboundHtml);
      const lead = recipients[0];
      const ackHtml = buildRecipientAckHtml({ deliverable, recipient: lead, grade, pmFirst });
      const ackText = stripHtml(ackHtml);

      const convId = deliverableConversationId(deliverableId);
      const sentIso = new Date().toISOString();
      const ackIso = new Date(Date.now() + 60_000).toISOString();
      const subject = deliverable.followUp.emailSubject;
      const toRecipients = recipients.map((r) => {
        const s = senders[r.key];
        return { name: r.name, address: s ? inboxSenderEmail(s, domain) : "" };
      });
      const leadSender = senders[lead.key];
      const leadAddress = leadSender ? inboxSenderEmail(leadSender, domain) : "";

      const { data: existingThread } = await supabase
        .from("project_email_threads")
        .select("id, message_count")
        .eq("project_id", projectId)
        .eq("graph_conversation_id", convId)
        .maybeSingle();

      let threadId = existingThread?.id as string | undefined;
      if (!threadId) {
        const { data: thread } = await supabase
          .from("project_email_threads")
          .insert({
            project_id: projectId,
            graph_conversation_id: convId,
            subject,
            participants: [pmName, ...recipients.map((r) => r.name)],
            latest_message_preview: ackText.slice(0, 280),
            latest_received_at: ackIso,
            message_count: 2,
            linked_by: project.training_owner_id,
            linked_at: sentIso,
          })
          .select("id")
          .single();
        threadId = thread?.id;
      } else {
        await supabase
          .from("project_email_threads")
          .update({
            latest_message_preview: ackText.slice(0, 280),
            latest_received_at: ackIso,
            message_count: (existingThread?.message_count ?? 0) + 2,
          })
          .eq("id", threadId);
      }

      if (threadId) {
        const stamp = Date.now();
        await supabase.from("project_email_messages").insert([
          {
            thread_id: threadId,
            project_id: projectId,
            provider_message_id: `${convId}-out-${stamp}`,
            from_name: pmName,
            from_address: pmEmail,
            to_recipients: toRecipients,
            cc_recipients: [],
            subject,
            sent_at: sentIso,
            body_text: outboundText,
            body_html: outboundHtml,
            snippet: outboundText.slice(0, 200),
            synced_at: sentIso,
          },
          {
            thread_id: threadId,
            project_id: projectId,
            provider_message_id: `${convId}-ack-${stamp}`,
            from_name: lead.name,
            from_address: leadAddress,
            to_recipients: [{ name: pmName, address: pmEmail }],
            cc_recipients: [],
            subject: `RE: ${subject}`,
            sent_at: ackIso,
            body_text: ackText,
            body_html: ackHtml,
            snippet: ackText.slice(0, 200),
            synced_at: ackIso,
          },
        ]);
      }
    } catch {
      /* best-effort — the grade still records if the simulated send hiccups */
    }
  }

  // 6) Upsert the submission (latest attempt wins; attempts increments).
  const { data: prior } = await supabase
    .from("training_deliverable_submissions")
    .select("attempts")
    .eq("project_id", projectId)
    .eq("deliverable_id", deliverableId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const row = {
    project_id: projectId,
    deliverable_id: deliverableId,
    user_id: session.id,
    day: deliverable.day,
    file_name: fileName,
    file_storage_path: storagePath,
    sent_to: sentTo,
    note,
    extracted_text: extracted.text,
    score: grade.score,
    letter: grade.letter,
    feedback: {
      summary: grade.summary,
      strengths: grade.strengths,
      gaps: grade.gaps,
      criteria: grade.criteria,
      degraded: grade.degraded,
    },
    attempts: (prior?.attempts ?? 0) + 1,
    graded_at: nowIso,
    updated_at: nowIso,
  };

  const { data: saved, error: saveError } = await supabase
    .from("training_deliverable_submissions")
    .upsert(row, { onConflict: "project_id,deliverable_id" })
    .select("*")
    .maybeSingle();

  if (saveError || !saved) {
    return NextResponse.json(
      { error: saveError?.message || "Failed to save the submission" },
      { status: 500 },
    );
  }

  return NextResponse.json({ submission: toClient(saved) });
}
