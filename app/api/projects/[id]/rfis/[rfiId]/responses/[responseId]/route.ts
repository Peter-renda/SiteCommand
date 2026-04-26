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
    .select("id, body, created_by")
    .eq("id", responseId)
    .eq("rfi_id", rfiId)
    .single();
  if (!response) return NextResponse.json({ error: "Response not found" }, { status: 404 });

  // RFI admins, the RFI creator, or the response author may delete a response.
  const toolLevel = await getToolLevel(session, projectId, "rfis");
  const canDelete =
    toolLevel === "admin" ||
    rfi.created_by === session.id ||
    response.created_by === session.id;
  if (!canDelete) {
    return NextResponse.json(
      { error: "Only an RFI admin, the RFI creator, or the response author can delete this response." },
      { status: 403 },
    );
  }

  const { error: clearOfficialError, count: clearedCount } = await supabase
    .from("rfis")
    .update({ official_response_id: null }, { count: "exact" })
    .eq("project_id", projectId)
    .eq("official_response_id", responseId);

  if (clearOfficialError) {
    return NextResponse.json({ error: clearOfficialError.message }, { status: 500 });
  }

  if ((clearedCount ?? 0) > 0) {
    await logRFIChange(supabase, session, rfiId, projectId, "Official Response", "Set", "Cleared");
  }

  const { error } = await supabase.from("rfi_responses").delete().eq("id", responseId).eq("rfi_id", rfiId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logRFIChange(supabase, session, rfiId, projectId, "Deleted Discussion Response", response.body, null);

  return NextResponse.json({ ok: true });
}
