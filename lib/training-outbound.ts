/**
 * Guard for real outbound email from training sandboxes.
 *
 * Simulation ("SiteCommand Training") projects must never send real email:
 * every contact in them is fake (see lib/training-identity.ts), and the only
 * "replies" come from the LLM (lib/training-email-reply.ts). Project tools that
 * would normally fire a Resend notification (RFIs, tasks, submittals,
 * commitments, transmittals, documents, invites, …) call this first and skip
 * the send when the project is a sandbox.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** True when the project is a training sandbox (`projects.is_training`). */
export async function isTrainingProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("projects")
    .select("is_training")
    .eq("id", projectId)
    .maybeSingle();
  return !!data?.is_training;
}
