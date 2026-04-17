import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendSsovNotificationEmail } from "@/lib/email";
import { requireToolLevel } from "@/lib/tool-permissions";

function contactName(c: {
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
}): string {
  if (c.type === "company") return c.company || "";
  if (c.type === "group" || c.type === "distribution_group") return c.group_name || "";
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

// Admin-only: sends the Subcontractor SOV notification to the invoice contact.
// Only available when SSOV is in Draft or Revise & Resubmit and an invoice
// contact has been assigned on the commitment.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("number, title, original_contract_amount, ssov_enabled, ssov_status, sov_accounting_method, subcontractor_contact")
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .single();

  if (!commitment) return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
  if (commitment.sov_accounting_method !== "amount") {
    return NextResponse.json(
      { error: "Subcontractor SOV is only available on Amount Based commitments." },
      { status: 409 }
    );
  }
  if (!commitment.ssov_enabled) {
    return NextResponse.json({ error: "Subcontractor SOV is not enabled on this commitment." }, { status: 409 });
  }
  const status = commitment.ssov_status || "draft";
  if (status !== "draft" && status !== "revise_resubmit") {
    return NextResponse.json(
      { error: "Send SSOV Notification is only available when status is Draft or Revise & Resubmit." },
      { status: 409 }
    );
  }
  if (!commitment.subcontractor_contact) {
    return NextResponse.json(
      { error: "Assign an invoice contact on the commitment before sending the SSOV notification." },
      { status: 409 }
    );
  }

  // Look up the directory contact by the stored name and find an email.
  const { data: contactsByName } = await supabase
    .from("directory_contacts")
    .select("id, type, first_name, last_name, company, group_name, email")
    .eq("project_id", projectId);

  const contactMatch = (contactsByName || []).find(
    (c) => contactName(c) === commitment.subcontractor_contact && !!c.email
  );

  if (!contactMatch?.email) {
    return NextResponse.json(
      {
        error:
          `No email is set on the invoice contact "${commitment.subcontractor_contact}". ` +
          "Add an email to the contact in the project directory and try again.",
      },
      { status: 409 }
    );
  }

  // Resolve surrounding context for the email body.
  const [{ data: project }, { data: sender }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).single(),
    supabase.from("users").select("username").eq("id", session.id).single(),
  ]);

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get("origin") ||
    `https://${req.headers.get("host") ?? "sitecommand.xyz"}`;
  const ssovUrl = `${origin}/projects/${projectId}/commitments/${commitmentId}/ssov`;
  const recipientName = contactName(contactMatch);

  try {
    await sendSsovNotificationEmail(
      contactMatch.email,
      recipientName,
      sender?.username || "A SiteCommand user",
      commitment.number,
      commitment.title || "Commitment",
      Number(commitment.original_contract_amount || 0),
      project?.name || "your project",
      ssovUrl
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to send SSOV notification email: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({ ssov_notified_at: new Date().toISOString() })
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
