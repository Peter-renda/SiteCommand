import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { requireToolLevel } from "@/lib/tool-permissions";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import { logRFIChange } from "@/lib/rfi-history";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(projectId, session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .order("rfi_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const denied = await requireToolLevel(session, projectId, "rfis", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("rfis")
    .select("rfi_number")
    .eq("project_id", projectId)
    .order("rfi_number", { ascending: false })
    .limit(1)
    .single();

  const autoNumber = (maxRow?.rfi_number ?? 0) + 1;

  const body = await req.json();
  const customNumber = typeof body.rfi_number === "number" && Number.isInteger(body.rfi_number) && body.rfi_number > 0 ? body.rfi_number : null;
  const nextNumber = customNumber ?? autoNumber;

  const subject = (body.subject ?? "").toString().slice(0, 200);
  const {
    question,
    due_date,
    status,
    rfi_manager_id,
    received_from_id,
    assignees,
    distribution_list,
    responsible_contractor_id,
    specification_id,
    drawing_number,
    schedule_impact,
    cost_impact,
    cost_code,
    sub_job,
    rfi_stage,
    private: isPrivate,
    attachments,
  } = body;

  const { data, error } = await supabase
    .from("rfis")
    .insert({
      project_id: projectId,
      rfi_number: nextNumber,
      subject: subject || null,
      question: question || null,
      due_date: due_date || null,
      status: status === "open" ? "open" : "draft",
      rfi_manager_id: rfi_manager_id || null,
      received_from_id: received_from_id || null,
      assignees: assignees ?? [],
      distribution_list: distribution_list ?? [],
      responsible_contractor_id: responsible_contractor_id || null,
      specification_id: specification_id || null,
      drawing_number: drawing_number || null,
      schedule_impact: schedule_impact || null,
      cost_impact: cost_impact || null,
      cost_code: cost_code || null,
      sub_job: sub_job || null,
      rfi_stage: rfi_stage || null,
      private: isPrivate ?? false,
      attachments: attachments ?? [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logRFIChange(supabase, session, data.id, projectId, "Created RFI", null, `RFI #${data.rfi_number}`);

  // Log initial values that were set on creation (matches the per-field /
  // per-member granularity of edit history)
  const memberLabel = (m: { id?: string | null; name?: string | null }) => m?.name?.trim() || m?.id?.trim() || "Unknown";
  const initialPromises: Promise<unknown>[] = [];

  const contactIds = [data.rfi_manager_id, data.received_from_id, data.responsible_contractor_id].filter(Boolean) as string[];
  const [contactsRes, specsRes] = await Promise.all([
    contactIds.length > 0
      ? supabase.from("directory_contacts").select("id, first_name, last_name").in("id", contactIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null }[] }),
    data.specification_id
      ? supabase.from("specifications").select("id, name, code").eq("id", data.specification_id).single()
      : Promise.resolve({ data: null as { id: string; name: string | null; code: string | null } | null }),
  ]);

  const contactNameById = (id: string | null): string | null => {
    if (!id) return null;
    const c = (contactsRes.data ?? []).find((x) => x.id === id);
    if (!c) return id;
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
    return name || id;
  };

  const spec = specsRes.data;
  const specLabel = spec ? (spec.code ? `${spec.name ?? spec.id} (${spec.code})` : (spec.name ?? spec.id)) : null;

  const scalarFields: { value: unknown; action: string; display: (v: unknown) => string | null }[] = [
    { value: data.subject, action: "Subject", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.due_date, action: "Due Date", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.status, action: "Status", display: (v) => (typeof v === "string" && v ? v.charAt(0).toUpperCase() + v.slice(1) : null) },
    { value: data.rfi_manager_id, action: "RFI Manager", display: (v) => contactNameById(typeof v === "string" ? v : null) },
    { value: data.received_from_id, action: "Received From", display: (v) => contactNameById(typeof v === "string" ? v : null) },
    { value: data.responsible_contractor_id, action: "Responsible Contractor", display: (v) => contactNameById(typeof v === "string" ? v : null) },
    { value: data.specification_id, action: "Specification", display: () => specLabel },
    { value: data.drawing_number, action: "Drawing Number", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.schedule_impact, action: "Schedule Impact", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.cost_impact, action: "Cost Impact", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.cost_code, action: "Cost Code", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.sub_job, action: "Sub Job", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.rfi_stage, action: "RFI Stage", display: (v) => (typeof v === "string" && v ? v : null) },
    { value: data.private, action: "Private", display: (v) => (v === true ? "Yes" : v === false ? null : null) },
  ];

  for (const f of scalarFields) {
    const display = f.display(f.value);
    if (!display) continue;
    initialPromises.push(logRFIChange(supabase, session, data.id, projectId, f.action, null, display));
  }

  // Question is rich text — log only that it was set, not the HTML
  if (typeof data.question === "string" && data.question.trim().length > 0) {
    initialPromises.push(logRFIChange(supabase, session, data.id, projectId, "Question", null, null));
  }

  const initialAssignees: { id?: string | null; name?: string | null }[] = Array.isArray(data.assignees) ? data.assignees : [];
  for (const m of initialAssignees) {
    initialPromises.push(logRFIChange(supabase, session, data.id, projectId, "Added Assignee", null, memberLabel(m)));
  }

  const initialDistribution: { id?: string | null; name?: string | null }[] = Array.isArray(data.distribution_list) ? data.distribution_list : [];
  for (const m of initialDistribution) {
    initialPromises.push(logRFIChange(supabase, session, data.id, projectId, "Added Distribution Member", null, memberLabel(m)));
  }

  const initialAttachments: { name?: string; url?: string }[] = Array.isArray(data.attachments) ? data.attachments : [];
  for (const a of initialAttachments) {
    initialPromises.push(logRFIChange(supabase, session, data.id, projectId, "Attachment Added", null, a.name ?? "Attachment"));
  }

  if (initialPromises.length > 0) {
    await Promise.allSettled(initialPromises);
  }

  if (session.company_id) {
    dispatchWebhookEvent(session.company_id, "rfi.created", {
      id: data.id,
      rfi_number: data.rfi_number,
      subject: data.subject,
      project_id: projectId,
    }).catch(() => {});
  }

  return NextResponse.json(data);
}
