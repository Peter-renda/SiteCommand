import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Sends email notification to distribution list for an RFI.
 * Distribution list emails come from directory (company directory).
 * To actually send email, wire this to Resend, SendGrid, or your provider.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const body = await req.json();
  const { distribution_emails, rfi_summary } = body as { distribution_emails: string[]; rfi_summary: string };

  if (!Array.isArray(distribution_emails) || distribution_emails.length === 0) {
    return NextResponse.json({ error: "No distribution emails" }, { status: 400 });
  }

  // TODO: Integrate with Resend/SendGrid/etc. For now we acknowledge the request.
  // Example with Resend: await resend.emails.send({ from: '...', to: distribution_emails, subject: 'New RFI', html: rfi_summary });
  return NextResponse.json({
    ok: true,
    message: "Notification queued (wire to your email provider in this route).",
    recipient_count: distribution_emails.length,
  });
}
