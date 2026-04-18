import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

// Admin-only: approves an Under Review Subcontractor SOV. Only valid while
// the SSOV is in the Under Review state. Records an approval timestamp and
// emits a change-history entry so the action is auditable alongside other
// commitment edits.
export async function POST(
  _req: NextRequest,
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
    .select("ssov_enabled, ssov_status, sov_accounting_method")
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
    return NextResponse.json(
      { error: "Subcontractor SOV is not enabled on this commitment." },
      { status: 409 }
    );
  }
  if (commitment.ssov_status !== "under_review") {
    return NextResponse.json(
      { error: "Approve is only available when status is Under Review." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({
      ssov_status: "approved",
      ssov_approved_at: new Date().toISOString(),
    })
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("commitment_change_history").insert({
    commitment_id: commitmentId,
    project_id: projectId,
    changed_by: session.id,
    changed_by_name: session.username,
    action: "Approved Subcontractor SOV",
    field_name: "ssov_status",
    from_value: "under_review",
    to_value: "approved",
  });

  return NextResponse.json(data);
}
