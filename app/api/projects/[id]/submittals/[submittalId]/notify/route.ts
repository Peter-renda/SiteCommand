import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendSubmittalCreatedEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, submittalId } = await params;
  const supabase = getSupabase();

  // Fetch submittal
  const { data: submittal } = await supabase
    .from("submittals")
    .select("submittal_number, title, distribution_list, submittal_manager_id, ball_in_court_id, approver_name_id")
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (!submittal) return NextResponse.json({ error: "Submittal not found" }, { status: 404 });

  // Fetch project name
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const projectName = project?.name ?? "Unknown Project";
  const submittalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/projects/${projectId}/submittals/${submittalId}`;

  // Collect all recipient IDs: manager + ball in court + approver
  const personIds = [
    submittal.submittal_manager_id,
    submittal.ball_in_court_id,
    submittal.approver_name_id,
  ].filter(Boolean) as string[];

  // Fetch their contact info
  const contactMap = new Map<string, { name: string; email: string | null }>();
  if (personIds.length) {
    const { data: contacts } = await supabase
      .from("directory_contacts")
      .select("id, first_name, last_name, email")
      .in("id", personIds);
    for (const c of contacts ?? []) {
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "there";
      contactMap.set(c.id, { name, email: c.email });
    }
  }

  // Build recipient list: distribution list + manager + ball in court + approver, deduped by email
  type Recipient = { name: string; email: string };
  const seen = new Set<string>();
  const recipients: Recipient[] = [];

  function addRecipient(name: string, email: string | null) {
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    recipients.push({ name, email });
  }

  // Distribution list (already has name + email)
  const distList = (submittal.distribution_list ?? []) as { id: string; name: string; email: string | null }[];
  for (const d of distList) addRecipient(d.name, d.email);

  // Manager
  if (submittal.submittal_manager_id) {
    const c = contactMap.get(submittal.submittal_manager_id);
    if (c) addRecipient(c.name, c.email);
  }

  // Ball In Court
  if (submittal.ball_in_court_id) {
    const c = contactMap.get(submittal.ball_in_court_id);
    if (c) addRecipient(c.name, c.email);
  }

  // Approver
  if (submittal.approver_name_id) {
    const c = contactMap.get(submittal.approver_name_id);
    if (c) addRecipient(c.name, c.email);
  }

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, recipient_count: 0 });
  }

  await Promise.allSettled(
    recipients.map((r) =>
      sendSubmittalCreatedEmail(
        r.email,
        r.name,
        submittal.submittal_number,
        submittal.title,
        projectName,
        submittalUrl,
      )
    )
  );

  return NextResponse.json({ ok: true, recipient_count: recipients.length });
}
