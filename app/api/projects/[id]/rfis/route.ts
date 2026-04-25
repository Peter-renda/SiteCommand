import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import { logRFIChange } from "@/lib/rfi-history";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .or(`private.eq.false,created_by.eq.${session.id}`)
    .order("rfi_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
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

  logRFIChange(supabase, session, data.id, projectId, "Created RFI", null, `RFI #${data.rfi_number}`);

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
