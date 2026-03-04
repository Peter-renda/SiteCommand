import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

function buildEmailHtml({
  projectName,
  rfiNumber,
  subject,
  question,
  dueDate,
  senderName,
}: {
  projectName: string;
  rfiNumber: number;
  subject: string;
  question: string | null;
  dueDate: string | null;
  senderName: string;
}): string {
  const dueDateStr = dueDate
    ? new Date(dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Not specified";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- Header -->
        <tr>
          <td style="background:#18181b;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">SiteCommand</p>
            <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">${projectName}</p>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;color:#71717a;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">New RFI Issued</p>
            <h1 style="margin:6px 0 0;color:#18181b;font-size:22px;font-weight:700;">RFI #${rfiNumber}: ${subject}</h1>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                  <span style="color:#71717a;font-size:13px;">RFI Number</span>
                  <p style="margin:2px 0 0;color:#18181b;font-size:14px;font-weight:500;">#${rfiNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                  <span style="color:#71717a;font-size:13px;">Due Date</span>
                  <p style="margin:2px 0 0;color:#18181b;font-size:14px;font-weight:500;">${dueDateStr}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;${question ? "border-bottom:1px solid #f4f4f5;" : ""}">
                  <span style="color:#71717a;font-size:13px;">Status</span>
                  <p style="margin:2px 0 0;color:#18181b;font-size:14px;font-weight:500;">Open</p>
                </td>
              </tr>
              ${question ? `
              <tr>
                <td style="padding:10px 0;">
                  <span style="color:#71717a;font-size:13px;">Question</span>
                  <p style="margin:6px 0 0;color:#18181b;font-size:14px;line-height:1.6;white-space:pre-wrap;">${question.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                </td>
              </tr>` : ""}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;color:#71717a;font-size:12px;">Issued by <strong style="color:#52525b;">${senderName}</strong> via SiteCommand. Log in to view the full RFI and respond.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const body = await req.json();
  const { distribution_emails } = body as { distribution_emails: string[] };

  if (!Array.isArray(distribution_emails) || distribution_emails.length === 0) {
    return NextResponse.json({ error: "No distribution emails" }, { status: 400 });
  }

  const supabase = getSupabase();

  const [rfiRes, projectRes] = await Promise.all([
    supabase.from("rfis").select("rfi_number, subject, question, due_date").eq("id", rfiId).eq("project_id", projectId).single(),
    supabase.from("projects").select("name").eq("id", projectId).single(),
  ]);

  if (rfiRes.error || !rfiRes.data) {
    return NextResponse.json({ error: "RFI not found" }, { status: 404 });
  }

  const rfi = rfiRes.data;
  const projectName = projectRes.data?.name ?? "Unknown Project";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping RFI email notification.");
    return NextResponse.json({ ok: true, skipped: true, reason: "Email provider not configured" });
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@sitecommand.app";

  const html = buildEmailHtml({
    projectName,
    rfiNumber: rfi.rfi_number,
    subject: rfi.subject ?? "No subject",
    question: rfi.question,
    dueDate: rfi.due_date,
    senderName: session.username,
  });

  const { error: sendError } = await resend.emails.send({
    from: `SiteCommand <${fromAddress}>`,
    to: distribution_emails,
    subject: `RFI #${rfi.rfi_number}: ${rfi.subject ?? "No subject"} — ${projectName}`,
    html,
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recipient_count: distribution_emails.length });
}
