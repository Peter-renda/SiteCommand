import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// Admin-only: sends the Subcontractor SOV notification to the invoice contact.
// Only available when SSOV is in Draft or Revise & Resubmit and an invoice
// contact has been assigned on the commitment.
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
    .select("ssov_enabled, ssov_status, sov_accounting_method, subcontractor_contact")
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
      { error: "Send SSOV Notification is only available when status is Draft or Revise & Resubmit." },
      { status: 409 }
    );
  }
  if (!commitment.subcontractor_contact) {
    return NextResponse.json(
      { error: "Assign an invoice contact on the commitment before sending the SSOV notification." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({ ssov_notified_at: new Date().toISOString() })
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
