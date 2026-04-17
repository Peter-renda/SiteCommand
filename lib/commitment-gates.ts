import { getSupabase } from "@/lib/supabase";

/**
 * Returns true if the general Schedule of Values may currently be edited on
 * this commitment. Matches the Procore rule: Draft-only, unless the project
 * has Enable Always Editable Schedule of Values turned on.
 */
export async function canEditSov(
  projectId: string,
  commitmentId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabase();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, status, project_id")
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .single();

  if (!commitment) return { allowed: false, reason: "Commitment not found" };
  if (commitment.status === "draft") return { allowed: true };

  const { data: settings } = await supabase
    .from("commitment_settings")
    .select("enable_always_editable_sov")
    .eq("project_id", projectId)
    .maybeSingle();

  if (settings?.enable_always_editable_sov) return { allowed: true };

  return {
    allowed: false,
    reason:
      "Schedule of Values can only be edited when the commitment is in Draft, " +
      "unless 'Enable Always Editable Schedule of Values' is turned on for this project.",
  };
}

/**
 * Returns true if the Subcontractor SOV may currently be edited on this
 * commitment. Matches the Procore rule: Amount Based accounting, SSOV tab
 * enabled, and status in Draft or Revise & Resubmit.
 */
export async function canEditSsov(
  projectId: string,
  commitmentId: string
): Promise<{ allowed: boolean; reason?: string; commitment?: CommitmentRow }> {
  const supabase = getSupabase();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, sov_accounting_method, ssov_enabled, ssov_status, project_id")
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .single();

  if (!commitment) return { allowed: false, reason: "Commitment not found" };

  if (commitment.sov_accounting_method !== "amount") {
    return {
      allowed: false,
      commitment,
      reason:
        "The Subcontractor SOV tab is only supported by the Amount Based " +
        "accounting method.",
    };
  }

  if (!commitment.ssov_enabled) {
    return {
      allowed: false,
      commitment,
      reason: "The Subcontractor SOV tab is not enabled on this commitment.",
    };
  }

  const status = commitment.ssov_status || "draft";
  if (status !== "draft" && status !== "revise_resubmit") {
    return {
      allowed: false,
      commitment,
      reason:
        "Subcontractor SOV can only be edited when status is Draft or Revise & Resubmit.",
    };
  }

  return { allowed: true, commitment };
}

export type CommitmentRow = {
  id: string;
  project_id: string;
  sov_accounting_method: string;
  ssov_enabled: boolean;
  ssov_status: string;
};
