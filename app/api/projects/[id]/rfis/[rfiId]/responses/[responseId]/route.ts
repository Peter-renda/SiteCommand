import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
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

  const canDelete = response.created_by === session.id || rfi.created_by === session.id;
  if (!canDelete) {
    return NextResponse.json({ error: "Only the response creator or RFI creator can delete this response." }, { status: 403 });
  }

  const { error } = await supabase.from("rfi_responses").delete().eq("id", responseId).eq("rfi_id", rfiId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (rfi.official_response_id === responseId) {
    await supabase.from("rfis").update({ official_response_id: null }).eq("id", rfiId).eq("project_id", projectId);
    await logRFIChange(supabase, session, rfiId, projectId, "Official Response", "Set", "Cleared");
  }

  await logRFIChange(supabase, session, rfiId, projectId, "Deleted Discussion Response", response.body, null);

  return NextResponse.json({ ok: true });
}
