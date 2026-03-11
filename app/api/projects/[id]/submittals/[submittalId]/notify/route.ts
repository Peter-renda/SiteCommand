import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params;
  const body = await req.json();
  const { distribution_emails, submittal_summary } = body as {
    distribution_emails: string[];
    submittal_summary: string;
  };

  if (!Array.isArray(distribution_emails) || distribution_emails.length === 0) {
    return NextResponse.json({ error: "No distribution emails" }, { status: 400 });
  }

  // TODO: Integrate with Resend/SendGrid/etc.
  return NextResponse.json({
    ok: true,
    message: "Notification queued (wire to your email provider in this route).",
    recipient_count: distribution_emails.length,
  });
}
