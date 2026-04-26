import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getToolLevel } from "@/lib/tool-permissions";
import { logRFIChange } from "@/lib/rfi-history";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string; responseId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId, responseId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase
    .from("rfis")
    .select("id, created_by, official_response_id")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { data: response } = await supabase
    .from("rfi_responses")
    .select("id, body, created_by, created_at")
    .eq("id", responseId)
    .eq("rfi_id", rfiId)
    .single();
  if (!response) return NextResponse.json({ error: "Response not found" }, { status: 404 });

  // Position of the response being deleted, by chronological insertion order.
  const { count: priorOrEqualCount } = await supabase
    .from("rfi_responses")
    .select("id", { count: "exact", head: true })
    .eq("rfi_id", rfiId)
    .lte("created_at", response.created_at);
  const responseNumber = priorOrEqualCount ?? 0;
  const responseLabel = responseNumber > 0 ? `Response #${responseNumber}` : null;

  const { error: clearOfficialError, count: clearedCount } = await supabase
    .from("rfis")
    .update({ official_response_id: null }, { count: "exact" })
    .eq("project_id", projectId)
    .eq("official_response_id", responseId);

  if (clearOfficialError) {
    return NextResponse.json({ error: clearOfficialError.message }, { status: 500 });
  }

  if ((clearedCount ?? 0) > 0) {
    await logRFIChange(supabase, session, rfiId, projectId, "Unmarked Official Response", responseLabel, null);
  }

  const { error } = await supabase.from("rfi_responses").delete().eq("id", responseId).eq("rfi_id", rfiId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logRFIChange(
    supabase,
    session,
    rfiId,
    projectId,
    responseNumber > 0 ? `Deleted Response #${responseNumber}` : "Deleted Response",
    response.body,
    null,
  );

  return NextResponse.json({ ok: true });
}
