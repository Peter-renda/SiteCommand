import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { checkProjectAccess } from "@/lib/permissions";
import { sendChangeEventRFQEmail } from "@/lib/email";

type RfqRecipientRow = {
  change_event_id: string;
  change_event_line_item_id?: string | null;
  commitment_id?: string | null;
  contract_company?: string | null;
  contract_number?: string | null;
  scope_description?: string | null;
  recipient_contact_id: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("change_event_rfqs")
    .select(`
      *,
      recipients:change_event_rfq_recipients(*)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const dueDate = typeof body.due_date === "string" && body.due_date ? body.due_date : null;
  const requestDetails = typeof body.request_details === "string" ? body.request_details : null;
  const distributionContactId = typeof body.distribution_contact_id === "string" && body.distribution_contact_id
    ? body.distribution_contact_id
    : null;
  const eventIds = Array.isArray(body.event_ids) ? body.event_ids.filter((v: unknown) => typeof v === "string") : [];
  const recipientRows = Array.isArray(body.recipients) ? (body.recipients as RfqRecipientRow[]) : [];

  if (!title) return NextResponse.json({ error: "RFQ title is required" }, { status: 400 });
  if (recipientRows.length === 0) {
    return NextResponse.json({ error: "At least one RFQ recipient is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const uniqueRecipientIds = Array.from(new Set(recipientRows.map((r) => r.recipient_contact_id).filter(Boolean)));
  const contactIds = distributionContactId
    ? Array.from(new Set([...uniqueRecipientIds, distributionContactId]))
    : uniqueRecipientIds;

  const { data: contacts } = await supabase
    .from("directory_contacts")
    .select("id, first_name, last_name, email")
    .in("id", contactIds);

  const contactMap = new Map<string, { name: string; email: string | null }>();
  for (const c of contacts ?? []) {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "there";
    contactMap.set(c.id, { name, email: c.email });
  }

  const distribution = distributionContactId ? contactMap.get(distributionContactId) : null;

  const { data: rfq, error: rfqError } = await supabase
    .from("change_event_rfqs")
    .insert({
      project_id: projectId,
      title,
      due_date: dueDate,
      request_details: requestDetails,
      distribution_contact_id: distributionContactId,
      distribution_name: distribution?.name ?? null,
      distribution_email: distribution?.email ?? null,
      change_event_ids: eventIds,
      created_by: session.id,
    })
    .select()
    .single();

  if (rfqError) return NextResponse.json({ error: rfqError.message }, { status: 500 });

  const recipientInsertRows = recipientRows.map((row) => {
    const contact = contactMap.get(row.recipient_contact_id);
    return {
      rfq_id: rfq.id,
      project_id: projectId,
      change_event_id: row.change_event_id || null,
      change_event_line_item_id: row.change_event_line_item_id || null,
      commitment_id: row.commitment_id || null,
      contract_company: row.contract_company || null,
      contract_number: row.contract_number || null,
      scope_description: row.scope_description || null,
      recipient_contact_id: row.recipient_contact_id,
      recipient_name: contact?.name ?? null,
      recipient_email: contact?.email ?? null,
    };
  });

  const { error: recipientsError } = await supabase
    .from("change_event_rfq_recipients")
    .insert(recipientInsertRows);

  if (recipientsError) return NextResponse.json({ error: recipientsError.message }, { status: 500 });

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const projectName = project?.name ?? "Unknown Project";
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/subcontractor`;

  const uniqueRecipients = Array.from(new Map(
    recipientInsertRows
      .filter((r) => r.recipient_email)
      .map((r) => [String(r.recipient_email).toLowerCase(), r])
  ).values());

  await Promise.allSettled(
    uniqueRecipients.map((r) => sendChangeEventRFQEmail(
      String(r.recipient_email),
      r.recipient_name ?? "there",
      projectName,
      title,
      dueDate,
      requestDetails,
      portalUrl,
    ))
  );

  return NextResponse.json({ ok: true, rfq_id: rfq.id, recipient_count: uniqueRecipients.length });
}
