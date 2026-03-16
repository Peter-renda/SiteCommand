import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
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
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("rfis")
    .select("rfi_number")
    .eq("project_id", projectId)
    .order("rfi_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.rfi_number ?? 0) + 1;

  const body = await req.json();
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
      attachments: attachments ?? [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
