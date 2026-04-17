import { getSupabase } from "@/lib/supabase";
import { getToolLevel } from "@/lib/tool-permissions";

type Session = {
  id: string;
  email?: string;
  role: string;
  company_id: string | null;
  company_role: string | null;
};

/**
 * Returns true if the session may view the Schedule of Values (and
 * Subcontractor SOV) on a given commitment.
 *
 * Matches the Procore "Allow Users to See SOV Items" rule. Non-admins
 * only see SOV detail on a private commitment when all are true:
 *   - commitment.sov_view_allowed is on
 *   - their directory contact (matched by email) appears in
 *     commitment_access_users for that commitment
 *
 * On a non-private commitment, non-admins can still see SOV as long
 * as they have Read Only on the tool.
 */
export async function canViewCommitmentSov(
  session: Session,
  projectId: string,
  commitmentId: string
): Promise<boolean> {
  const level = await getToolLevel(session, projectId, "commitments");
  if (level === "admin") return true;
  if (level === "none") return false;

  const supabase = getSupabase();
  const { data: commitment } = await supabase
    .from("commitments")
    .select("is_private, sov_view_allowed")
    .eq("id", commitmentId)
    .eq("project_id", projectId)
    .single();

  if (!commitment) return false;
  if (!commitment.is_private) return true;
  if (!commitment.sov_view_allowed) return false;

  if (!session.email) return false;

  const { data: accessRows } = await supabase
    .from("commitment_access_users")
    .select("directory_contact_id")
    .eq("commitment_id", commitmentId);

  const contactIds = (accessRows || []).map((r) => r.directory_contact_id as string);
  if (contactIds.length === 0) return false;

  const { data: matches } = await supabase
    .from("directory_contacts")
    .select("id, email")
    .eq("project_id", projectId)
    .in("id", contactIds);

  const sessionEmail = session.email.toLowerCase();
  return (matches || []).some((c) => (c.email || "").toLowerCase() === sessionEmail);
}
