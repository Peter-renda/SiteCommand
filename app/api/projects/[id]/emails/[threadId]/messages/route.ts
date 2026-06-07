/**
 * GET /api/projects/[id]/emails/[threadId]/messages
 *
 * Returns the full message chain for a linked email thread, fetched live
 * from the user's connected provider (Gmail or Outlook).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { fetchActiveThread } from "@/lib/email-connection";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, threadId } = await params;
  const supabase = getSupabase();

  // Validate the thread belongs to this project and resolve its conversation id.
  const { data: row } = await supabase
    .from("project_email_threads")
    .select("graph_conversation_id, subject")
    .eq("id", threadId)
    .eq("project_id", projectId)
    .single();

  if (!row) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  try {
    const { provider, accountEmail, messages } = await fetchActiveThread(
      session.id,
      row.graph_conversation_id
    );
    return NextResponse.json({ provider, accountEmail, subject: row.subject, messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("No Gmail connection found") ||
      message.includes("No Outlook connection found") ||
      message.includes("No email connection found")
    ) {
      return NextResponse.json({ error: "not_connected" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
