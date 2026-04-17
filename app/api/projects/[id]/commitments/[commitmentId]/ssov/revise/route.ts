import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// Admin-only: returns an Under Review SSOV to Revise & Resubmit so the
// invoice contact can edit and resubmit.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const supabase = getSupabase();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("ssov_enabled, ssov_status")
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .single();

  if (!commitment) return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
  if (!commitment.ssov_enabled) {
    return NextResponse.json({ error: "Subcontractor SOV is not enabled on this commitment." }, { status: 409 });
  }
  if (commitment.ssov_status !== "under_review") {
    return NextResponse.json(
      { error: "Revise & Resubmit is only available when status is Under Review." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({ ssov_status: "revise_resubmit" })
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
