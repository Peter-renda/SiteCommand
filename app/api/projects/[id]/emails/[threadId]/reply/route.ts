/**
 * POST /api/projects/[id]/emails/[threadId]/reply
 *
 * Sends a reply within a linked email thread from the user's connected account.
 * Body: { to: string, subject: string, body: string, cc?: string[],
 *         latestMessageId?: string, inReplyTo?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { sendActiveReply } from "@/lib/email-connection";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, threadId } = await params;
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("project_email_threads")
    .select("graph_conversation_id, subject")
    .eq("id", threadId)
    .eq("project_id", projectId)
    .single();

  if (!row) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const body = await req.json();
  const { to, subject, body: replyBody, cc, latestMessageId, inReplyTo } = body as {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string[];
    latestMessageId?: string;
    inReplyTo?: string;
  };

  if (!replyBody?.trim()) {
    return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
  }

  try {
    await sendActiveReply(session.id, {
      conversationId: row.graph_conversation_id,
      to: (to ?? "").trim(),
      subject: subject ?? row.subject ?? "",
      body: replyBody,
      cc: Array.isArray(cc) ? cc.filter(Boolean) : [],
      latestMessageId,
      inReplyTo,
    });
    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("No email connection found")) {
      return NextResponse.json({ error: "No email account connected." }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
