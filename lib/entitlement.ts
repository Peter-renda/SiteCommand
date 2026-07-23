import { getSupabase } from "@/lib/supabase";
import type { LessonTrack } from "@/lib/training-lessons";

/**
 * Membership entitlement — free tier vs. full (trial/paid) access.
 *
 * A brand-new "free account" is an ordinary company whose subscription has
 * never started (subscription_status is null / not active). Free accounts get
 * a limited slice of the product: the Pre-Construction & Entitlements lessons,
 * plus the Resources, Career Center, and Community pages. Everything else in
 * the training curriculum (other lesson tracks, the practice sandbox, the
 * skills/credential area, and company guides) sits behind a "start your free
 * trial" wall.
 *
 * Full access is granted when the company has an active or trialing Stripe
 * subscription — the same statuses the login/checkout flows treat as paid —
 * and always for the internal team (site_admin).
 */

type SessionLike = {
  id: string;
  role?: string | null;
  company_id?: string | null;
} | null;

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

// Lesson tracks a free account can read in full. Everything else prompts an
// upgrade. `precon` is the "Pre-Construction & Entitlements" section.
export const FREE_LESSON_TRACKS: readonly LessonTrack[] = ["precon"];

/** Whether the session's account has full (trial/paid) access to the app. */
export async function hasFullAccess(session: SessionLike): Promise<boolean> {
  if (!session) return false;
  // Internal team is never gated.
  if (session.role === "site_admin") return true;
  if (!session.company_id) return false;

  const supabase = getSupabase();
  const { data } = await supabase
    .from("companies")
    .select("subscription_status")
    .eq("id", session.company_id)
    .maybeSingle();

  const status = data?.subscription_status ?? null;
  return status !== null && ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}

/**
 * Whether a lesson in the given track should show the upgrade wall instead of
 * its content for an account with the given access level.
 */
export function lessonRequiresUpgrade(track: LessonTrack, fullAccess: boolean): boolean {
  return !fullAccess && !FREE_LESSON_TRACKS.includes(track);
}
