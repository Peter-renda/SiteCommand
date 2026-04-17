import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireSsovWriter } from "@/lib/tool-permissions";

// Invoice-contact action: submits the Subcontractor SOV for review.
// Only valid when the total of SSOV detail lines fully allocates the
// commitment's original contract amount (Remaining to Allocate = $0).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const denied = await requireSsovWriter(session, projectId, commitmentId);
  if (denied) return denied;

  const supabase = getSupabase();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("ssov_enabled, ssov_status, sov_accounting_method, original_contract_amount")
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
    return NextResponse.json({ error: "Subcontractor SOV is not enabled on this commitment." }, { status: 409 });
  }
  const status = commitment.ssov_status || "draft";
  if (status !== "draft" && status !== "revise_resubmit") {
    return NextResponse.json(
      { error: "Submit is only available when status is Draft or Revise & Resubmit." },
      { status: 409 }
    );
  }

  const { data: items } = await supabase
    .from("commitment_ssov_items")
    .select("amount")
    .eq("commitment_id", commitmentId);

  const allocated = (items || []).reduce((s, i) => s + Number(i.amount || 0), 0);
  const committed = Number(commitment.original_contract_amount || 0);
  const remaining = Math.round((committed - allocated) * 100) / 100;

  if (remaining !== 0) {
    return NextResponse.json(
      { error: `Submit is disabled until Remaining to Allocate is $0.00 (currently $${remaining.toFixed(2)}).` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({
      ssov_status: "under_review",
      ssov_submitted_at: new Date().toISOString(),
    })
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
